# Claiming a name

## The flow

1. Go to [runs-on.dev](https://runs-on.dev).
2. Sign in with GitHub (`app/api/auth/github/route.js` starts the OAuth
   flow; `.../callback/route.js` completes it and sets a signed session
   cookie).
3. Type a name. The form checks availability against `GET /api/check` as
   you type (debounced, see `app/claim-form.jsx`).
4. If it's available, click "Claim it". That calls `POST /api/claim`,
   which:
   - reads your session cookie (`lib/session.js`),
   - validates the name's grammar (`lib/name.js`) and checks it against the
     reserved-name lists (`lib/blocklist.js`),
   - checks eligibility (below),
   - and writes `domains/<name>.json` directly to this repo via the GitHub
     Contents API (`lib/registry.js`), with no pull request involved.

The write is an atomic create: no `sha` is sent, so GitHub itself refuses
to overwrite a file that already exists. That's what stops two people
claiming the same name in a race — whoever's request lands first wins, and
the second gets `409 taken`. See `putRecord` in `lib/registry.js`.

Once the file exists, the name resolves immediately: `*.runs-on.dev` is a
wildcard DNS record, so there's nothing to provision. You get a profile
card built from your GitHub account until you point the name at your own
hosting (see the main [README](../README.md#point-it-at-your-own-hosting)).

## Eligibility

Claiming requires, checked by `lib/eligibility.js`:

- **Your GitHub account is at least 30 days old.**
- **Your account has at least one public repository.**

Both are enforced server-side in `POST /api/claim` via `evaluateClaim`
(`lib/claim.js`), not just in the UI.

### Why these limits exist

Names cannot be un-given once claimed except by the owner releasing them or
a maintainer pulling one under [POLICY.md](../POLICY.md). Without any
barrier to entry, a script that mints fresh GitHub accounts could sweep
every short, memorable name in the registry within the first hour of
launch, and there would be no way to get any of them back short of manual
takedowns. A 30-day-old account with at least one public repo is cheap for
a real developer and expensive for a bot farm to fake at scale, which is
the actual goal: keep the barrier low for genuine users and high for a
land-grab.

### What isn't enforced (yet)

There's currently no limit on how many names a single GitHub account can
claim — `lib/eligibility.js` and `lib/claim.js` don't check that. If you're
relying on a hard one-name-per-account cap, don't; it isn't there today.

## Reserved names

`GET /api/check` and `POST /api/claim` both reject a name that
`lib/blocklist.js` flags as reserved, before eligibility is even checked.
Three lists back this, documented in [`data/README.md`](../data/README.md):
infrastructure names the registry itself needs, brands actually
impersonated in the wild, and an English profanity/slur list. Matching is
exact (case-insensitive, trimmed) — no substring matching, so a reserved
word appearing inside a longer valid name is fine.

## Releasing a name

Delete `domains/<name>.json` in a pull request. `lib/pr.js` requires the PR
author's GitHub login to match the record's `owner.github` for a removal to
pass CI. Once merged, `scripts/sync-dns.mjs` clears any DNS records that
had been synced for that name.
