# runs-on.dev

A free subdomain registry. Sign in with GitHub, claim a name, and get
`<name>.runs-on.dev` pointed at whatever you're hosting. It's a subdomain
registry, not a TLD. Every name lives under `runs-on.dev`, which Advance
Labs owns and is responsible for. See [POLICY.md](./POLICY.md) for the
rules names are held under.

## Claiming a name

Go to the website, sign in with GitHub, and type the name you want. If it's
available, claiming it writes a record to `domains/<name>.json` in this repo
and you're done. No DNS to configure for the default setup.

## Pointing a name at your own hosting

Once you own a name, you point it at your own site by editing its record and
opening a pull request. Each name is one JSON file at `domains/<name>.json`,
and a pull request may change exactly one such file.

1. Fork this repo.
2. Edit `domains/<name>.json`, adding a `CNAME`, `A`, or `TXT` record under
   `records`.
3. Open a pull request. CI validates the change; once it's green and merged,
   the sync workflow pushes the record to DNS.

To release a name you no longer want, delete its `domains/<name>.json` file
in a pull request instead of editing it. New names can't be claimed this
way, only by signing in on the site; see [What CI enforces](#what-ci-enforces).

### Vercel

Vercel's dashboard gives you a `CNAME` target when you add a custom domain
to a project. It's normally `cname.vercel-dns.com`. Use it:

```json
{
  "name": "you",
  "owner": { "github": "you" },
  "claimedAt": "2026-01-01T00:00:00.000Z",
  "records": {
    "CNAME": "cname.vercel-dns.com"
  }
}
```

### GitHub Pages

Point the record at your GitHub Pages hostname, `<username>.github.io`:

```json
{
  "name": "you",
  "owner": { "github": "you" },
  "claimedAt": "2026-01-01T00:00:00.000Z",
  "records": {
    "CNAME": "you.github.io"
  }
}
```

You'll also need a `CNAME` file in the Pages repo itself containing
`you.runs-on.dev`, per GitHub's usual custom-domain setup.

### Netlify

Netlify's load balancer hostname for custom domains is
`apex-loadbalancer.netlify.com`:

```json
{
  "name": "you",
  "owner": { "github": "you" },
  "claimedAt": "2026-01-01T00:00:00.000Z",
  "records": {
    "CNAME": "apex-loadbalancer.netlify.com"
  }
}
```

Add `you.runs-on.dev` as a custom domain in the Netlify site's settings so it
issues a certificate for it.

## Record schema

Every record is validated against [`schema/record.schema.json`](./schema/record.schema.json):

- `name`: the subdomain, lowercase alphanumeric with internal hyphens, 2–32
  characters.
- `owner.github`: the GitHub login that owns the record. Nothing else is
  allowed under `owner`.
- `claimedAt`: an ISO 8601 timestamp, set once when the name is claimed.
- `records`: one of:
  - `CNAME`: a single hostname string. Cannot appear alongside `A` or `TXT`.
  - `A`: a non-empty array of IPv4 addresses.
  - `TXT`: a non-empty array of strings, each up to 255 characters.

No other top-level keys are allowed, and no other record types are allowed.

## What CI enforces

Every pull request touching `domains/**` runs `lib/pr.js`'s
`validateChangeset` against the PR (see
[`.github/workflows/validate.yml`](./.github/workflows/validate.yml)). It
checks out the *base* branch to run the validator itself, so a PR can't
rewrite the validator to approve itself. The rules:

- The PR must change **exactly one file**.
- That file must match `domains/<name>.json`: nothing outside `domains/`,
  and no touching a second record.
- **Renaming a record is refused outright.** A rename arrives as a single
  changed file carrying only the new path, which would otherwise skip the
  ownership check entirely and let anyone delete someone else's
  registration by renaming it. If you need a different name, claim a new
  one instead.
- The file's content must validate against `schema/record.schema.json`, and
  the record's `name` field must match the filename.
- If the record already exists, only the pull request author whose GitHub
  login matches the existing `owner.github` may change it.
- **`owner` cannot be changed by pull request.** Neither can `claimedAt`.
  Both are set once, at claim time, through the website.
- **New names cannot be claimed by pull request.** Only the website enforces
  the account-age and public-repo eligibility checks a claim requires, so a
  PR that adds a record for a name with no existing `domains/<name>.json`
  is rejected outright. Claim the name on the site first, then open a
  pull request to point it at your hosting.
- **An owner may delete their own record by pull request**, by removing
  `domains/<name>.json`. A maintainer can do the same to take down a name
  under [POLICY.md](./POLICY.md).

## Contributing to the blocklists

Reserved names live in `data/` as flat, lowercase JSON arrays, matched
exactly (case-insensitive, trimmed, no substring matching) by
`lib/blocklist.js`:

- `data/reserved-infrastructure.json`: names the registry itself needs
  (`www`, `api`, `mail`, `_dmarc`, and similar). Extend by pull request as
  the infrastructure grows.
- `data/reserved-brands.json`: names actually impersonated in the wild.
  Extend by pull request as new impersonation attempts turn up.
- `data/reserved-words.json`: an English profanity/slur blocklist, seeded
  from
  [LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words)
  (English list), licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Entries that
  can never match a valid name (spaces, `&`, or other characters the name
  grammar already rejects) are filtered out, and entries that collide with
  common given names are removed on report. Extend by pull request; keep
  entries lowercase and grammar-valid.

Send blocklist changes as their own pull request, separate from any
`domains/` change. The two touch different validation paths.

## Local development

```bash
npm install
npm run dev
```

The claim flow needs a signed-in GitHub session, and the session and OAuth
state cookies are set `Secure` (see `app/api/auth/github/route.js` and
`.../callback/route.js`). A `Secure` cookie is dropped by the browser over
plain HTTP, so **the GitHub sign-in flow cannot be exercised on
`http://localhost`.** This is the right tradeoff, not an oversight:
`runs-on.dev` is on the HSTS preload list, so production is always HTTPS,
and cookies that only ever travel over HTTPS shouldn't have a `Secure`-free
code path just for local convenience.

To exercise sign-in locally, serve the app over HTTPS with a locally-trusted
certificate. [mkcert](https://github.com/FiloSottile/mkcert) is the
simplest way:

```bash
mkcert -install
mkcert localhost
```

then run `next dev` behind a TLS-terminating proxy (or any local HTTPS
wrapper) pointed at it, and set `APP_ORIGIN` to the `https://` URL you're
serving from so the OAuth redirect URI matches. Everything that doesn't
touch sign-in (name validation, schema checks, the blocklist, the record
UI) works fine over plain `http://localhost` without any of this.

## Environment variables

From [`.env.example`](./.env.example):

| Variable | Purpose |
| --- | --- |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID, used to start the sign-in flow. |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret, used to exchange the OAuth code for an access token. |
| `SESSION_SECRET` | 32 random bytes, hex-encoded, used to sign the session cookie. |
| `APP_ORIGIN` | The public origin the app is served from, no trailing slash (e.g. `https://runs-on.dev`). Used to build the OAuth redirect URI. |
| `REGISTRY_REPO` | `owner/repo` of the registry data repo (this repo) that records are read from and written to. |
| `REGISTRY_TOKEN` | A GitHub token with `contents:write` on `REGISTRY_REPO`, used to read and commit records. |
| `GITHUB_WEBHOOK_SECRET` | Signs the GitHub webhook that `app/api/revalidate/route.js` verifies before revalidating a changed `/sites/<name>` page after a merge. |
| `CARD_TOKEN` | Optional. A read-only GitHub token used for profile-card renders (`/sites/<name>` and every `<name>.runs-on.dev` request), kept separate from `REGISTRY_TOKEN` so a hostname-enumeration curl loop can't exhaust the quota `/api/claim` depends on. Falls back to `REGISTRY_TOKEN` if unset. |
