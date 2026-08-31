# Contributing

## Adding to the blocklists

Reserved names live in `data/` as flat, lowercase JSON arrays, matched
exactly (case-insensitive, trimmed, no substring matching) by
`lib/blocklist.js`. See [`data/README.md`](../data/README.md) for what each
file is for:

- `data/reserved-infrastructure.json` — names the registry itself needs
  (`www`, `api`, `mail`, `_dmarc`, and similar).
- `data/reserved-brands.json` — names actually impersonated in the wild.
- `data/reserved-words.json` — the English profanity/slur list, seeded from
  [LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words)
  (CC BY 4.0). Entries that can never match a valid name (spaces, `&`, or
  anything `lib/name.js`'s grammar already rejects) are filtered out, and
  entries that collide with common given names are removed on report.

Send blocklist changes as their own pull request, separate from any
`domains/` change — they go through a different validation path
(`npm test`'s `blocklist.test.mjs`), not `lib/pr.js`'s `validateChangeset`.
Keep entries lowercase and grammar-valid, one per line, sorted where the
existing file already is.

## Running tests

```bash
npm install
npm test
```

This runs every file under `test/**/*.test.mjs` with Node's built-in test
runner (`node --test`). As of this writing that's 61 tests covering the
record schema, the name grammar, eligibility rules, PR validation, DNS
planning, session signing, and the blocklist. No build step or running
server is required — the suite exercises the library functions directly.

## What CI checks

Three workflows, all under `.github/workflows/`:

- **`test.yml`** runs on every pull request: `npm test`, then `npm run
  build` to catch anything the test suite wouldn't (a broken import, a
  React error at build time).
- **`validate.yml`** runs on pull requests that touch `domains/**`. It
  checks out the PR's *base* branch (not the PR's own code — see
  [docs/architecture.md](./architecture.md#the-two-write-paths-into-domains))
  and runs `scripts/validate-pr.mjs`, which calls `lib/pr.js`'s
  `validateChangeset` against the actual PR diff over the GitHub API.
- **`sync-dns.yml`** runs on pushes to `main` that touch `domains/**`
  (i.e., after a PR merges), and pushes the resulting DNS changes to
  Vercel. It doesn't gate pull requests; it's what makes a merged record
  change take effect.

If you're changing `lib/pr.js`, `lib/schema.js`, `lib/name.js`, or anything
else those two gating workflows depend on, add or update a test in `test/`
alongside the change — that's what `npm test` in `validate.yml` and
`test.yml` will actually run against your PR.
