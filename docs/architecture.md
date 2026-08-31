# Architecture

## From request to rendered card

1. A browser requests `you.runs-on.dev`.
2. DNS resolves it via the wildcard `*.runs-on.dev` record (see below),
   landing on the same Vercel project as `runs-on.dev` itself.
3. `proxy.js` (Next's middleware) reads the `Host` header, strips the
   `.runs-on.dev` suffix, validates the remaining label with
   `lib/name.js`'s `validateName`, and rewrites the request internally to
   `/sites/<name>`.
4. `app/sites/[name]/page.jsx` reads `domains/<name>.json` from this repo
   via the GitHub Contents API (`lib/registry.js`'s `getRecord`), then
   fetches the owner's public GitHub profile, and renders the card.

If the name fails `validateName` (bad characters, wrong length, punycode),
`proxy.js` returns 404 before any GitHub request happens. If the name is
valid but has no record, `getRecord` returns `null` and the page calls
`notFound()`.

`/sites/*` is also a real Next.js route, so `proxy.js` explicitly 404s any
direct external request to it — the rewrite target must only be reachable
through the internal rewrite, not from the outside on any host.

## The wildcard

One DNS record, `*.runs-on.dev` pointed at the Vercel project, is enough
for every grammar-valid subdomain to resolve with a valid HTTPS certificate
the moment it's requested — Vercel issues wildcard TLS for domains it
manages. That means claiming a name is a git commit against this repo, not
a DNS write: nothing has to be provisioned in DNS at all for the default
profile-card behavior. This single record, set up once outside this repo's
automation, is what the whole "no DNS to configure" claim in the README
rests on.

When a record does carry a `CNAME`, `A`, or `TXT` entry, `scripts/sync-dns.mjs`
creates an exact-name DNS record for that one subdomain. Vercel's resolver
prefers an exact match over the wildcard, so that specific name now routes
to the owner's own hosting instead of the app, while every other name keeps
falling through to the wildcard and the profile card. See
[docs/records.md](./records.md#how-a-record-reaches-dns) for the sync
mechanics.

## The two write paths into `domains/`

There are exactly two ways a `domains/<name>.json` file gets created or
changed, and they enforce different things:

- **Claiming a new name** goes through `POST /api/claim`
  (`app/api/claim/route.js`), which checks a live GitHub session,
  eligibility (`lib/eligibility.js`), and the reserved-name lists
  (`lib/blocklist.js`) before writing directly to the repo with
  `lib/registry.js`'s `putRecord`. This is the only path that can create a
  brand-new record.
- **Changing an existing record** — adding hosting records, or removing the
  record entirely — goes through a pull request, validated by
  `lib/pr.js`'s `validateChangeset` in
  [`.github/workflows/validate.yml`](../.github/workflows/validate.yml).
  That workflow checks out the PR's *base* branch before running the
  validator, so a PR can't rewrite `lib/pr.js` to approve itself, and it
  refuses to let a PR create a record for a name with no existing file —
  new names only come from the claim path above, which is the only place
  eligibility is actually checked.

Ownership enforcement lives in `validateChangeset`: only the GitHub login
recorded in `owner.github` may change or remove a record by pull request,
and `owner`/`claimedAt` can never be changed by pull request at all, only
set once at claim time.

## Why `CARD_TOKEN` is separate from `REGISTRY_TOKEN`

`REGISTRY_TOKEN` has `contents:write` on this repo and is what `/api/claim`
and `/api/check` use to read and write records — it's the token the whole
claim flow's rate-limit budget depends on. But `*.runs-on.dev` is a
wildcard: every grammar-valid hostname resolves and triggers a GitHub read
in `app/sites/[name]/page.jsx`, on every request, from anyone. An anonymous
curl loop over a few thousand candidate names would burn through
`REGISTRY_TOKEN`'s quota just rendering cards, and push real claims into
the `503 busy` path (`lib/registry.js` treats `403`/`429` from GitHub as
`ratelimited`, and `app/claim-form.jsx` retries those with backoff — but
only up to a point).

`CARD_TOKEN` is a separate, read-only token used only for profile-card
renders (`app/sites/[name]/page.jsx` and, indirectly, every
`<name>.runs-on.dev` request). It falls back to `REGISTRY_TOKEN` if unset,
but setting it means the two workloads draw from different rate-limit
budgets, so enumerating hostnames can't starve the claim flow.
