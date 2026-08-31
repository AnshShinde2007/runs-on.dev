# Record format

Every claimed name is one JSON file at `domains/<name>.json`, validated
against [`schema/record.schema.json`](../schema/record.schema.json) and
`lib/schema.js`'s `validateRecord`. No key outside this shape is allowed.

```json
{
  "name": "you",
  "owner": { "github": "you" },
  "claimedAt": "2026-01-01T00:00:00.000Z",
  "records": {}
}
```

## Fields

### `name`

The subdomain, lowercase. Validated by `lib/name.js`: 2–32 characters,
`[a-z0-9]` with internal hyphens (never leading or trailing), and no
punycode (`xn--` prefixes and `--` at the third/fourth character are
rejected). Must match the filename — `domains/you.json` must contain
`"name": "you"`.

### `owner`

Exactly one key, `github`, the GitHub login that owns the record. Set once
at claim time and immutable by pull request afterward — `lib/pr.js` rejects
any PR that changes it.

### `claimedAt`

An ISO 8601 timestamp, set once when the name is claimed. Also immutable by
pull request.

### `records`

An object holding zero or one of three record types. An empty `records`
object is valid — it's the default state right after claiming, and it
means the name serves the built-in profile card instead of pointing
anywhere else.

| Type | Shape | Notes |
| --- | --- | --- |
| `CNAME` | a single hostname string | Cannot appear alongside `A` or `TXT`. |
| `A` | a non-empty array of IPv4 addresses | One DNS record is created per address. |
| `TXT` | a non-empty array of strings, each up to 255 characters | One DNS record per string. |

## Why CNAME can't coexist with A or TXT

This isn't a rule the registry invented — it's a DNS protocol constraint.
A CNAME record aliases a name to another name entirely, and the DNS spec
doesn't allow a name that has a CNAME to have any other record type
alongside it (an A record at the same name, for instance, would leave a
resolver with two contradictory answers for what the name actually is).
`lib/schema.js` enforces this at the record level, `records.CNAME` cannot
appear next to `records.A` or `records.TXT`, so a change that would produce
invalid DNS is rejected in CI before it ever reaches
`scripts/sync-dns.mjs`.

If you need both a routing target and a TXT record (a domain-verification
string, for example), use `A` with your host's IP addresses instead of
`CNAME`, since `A` and `TXT` may coexist.

## Hosting worked examples

All four are drop-in `records` values, verified against the schema above.

### Vercel

```json
"records": { "CNAME": "cname.vercel-dns.com" }
```

The Vercel dashboard shows this exact value when you add a custom domain to
a project (Project → Settings → Domains).

### GitHub Pages

```json
"records": { "CNAME": "you.github.io" }
```

Replace `you` with your GitHub username or org. You'll also need a `CNAME`
file in the Pages repo itself containing `you.runs-on.dev`, which is
GitHub's standard custom-domain setup, independent of this registry.

### Netlify

```json
"records": { "CNAME": "apex-loadbalancer.netlify.com" }
```

Then add `you.runs-on.dev` as a custom domain in the Netlify site's
settings so it can issue a TLS certificate for it.

### Cloudflare Pages

```json
"records": { "CNAME": "you-project.pages.dev" }
```

Replace `you-project` with your Pages project's own `*.pages.dev`
subdomain, then add `you.runs-on.dev` as a custom domain in the Pages
project's settings.

## How a record reaches DNS

Merging a PR that changes `domains/<name>.json` triggers
[`.github/workflows/sync-dns.yml`](../.github/workflows/sync-dns.yml),
which runs `scripts/sync-dns.mjs`. It computes the desired DNS records from
your file via `lib/dns.js`'s `planDnsChanges`, deletes whatever was synced
for that name before, and creates the new set through Vercel's domains API.
If you remove your record instead of editing it, the same workflow clears
any DNS it had created for that name. You never touch DNS directly.
