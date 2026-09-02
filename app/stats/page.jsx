import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Section } from '../components/Section.jsx';
import { summarize } from '../../lib/stats.js';
import { GrowthChart } from './growth-chart.jsx';

export const metadata = {
  title: 'Stats',
  description:
    'How many names have been claimed on runs-on.dev, by whom, and what people point them at. Counted straight from the public registry.',
  alternates: { canonical: 'https://runs-on.dev/stats' },
  openGraph: { title: 'Stats — runs-on.dev' },
};

// Read at build time, never per request. Deploys run from GitHub Actions on
// merge to main, so a claim and this page's rebuild are the same event -- the
// numbers are never more than one merge stale. Reading `domains/` off disk
// also keeps the page off the GitHub API entirely, which matters because the
// wildcard makes that quota trivially easy to exhaust (see app/sites).
export const dynamic = 'force-static';

function readRegistry() {
  const dir = join(process.cwd(), 'domains');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

const USAGE_LABELS = {
  card: 'Profile card',
  cname: 'Pointed at a host',
  url: 'Redirect to a URL',
  advanced: 'Custom DNS records',
};

function Stat({ label, value }) {
  return (
    <div className="border border-(--color-rule) bg-(--color-card) p-4">
      <div className="font-(family-name:--font-display) text-3xl font-medium tracking-tight text-(--color-ink)">
        {value}
      </div>
      <div className="mt-1 font-(family-name:--font-mono) text-xs tracking-[0.08em] text-(--color-muted) uppercase">
        {label}
      </div>
    </div>
  );
}

function day(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function Stats() {
  const stats = summarize(readRegistry());
  const usage = Object.entries(stats.usage).filter(([, count]) => count > 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-(family-name:--font-display) text-3xl font-medium tracking-tight text-(--color-ink) sm:text-4xl">
        Stats
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-(--color-muted)">
        Every name here is a file in a public repo, so these numbers are just that repo
        counted. Nothing is estimated and nothing is tracked about visitors.
      </p>

      <Section title="Where things stand">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Names claimed" value={stats.total} />
          <Stat label="People" value={stats.owners} />
          <Stat label="Claimed this week" value={stats.claimedThisWeek} />
        </div>
      </Section>

      {stats.cumulative.length > 1 && (
        <Section title="Names claimed over time">
          <GrowthChart series={stats.cumulative} />
        </Section>
      )}

      {usage.length > 0 && (
        <Section title="What people do with them">
          <ul className="divide-y divide-(--color-rule) border border-(--color-rule) bg-(--color-card)">
            {usage
              .sort((a, b) => b[1] - a[1])
              .map(([mode, count]) => (
                <li key={mode} className="flex items-baseline justify-between px-4 py-3">
                  <span className="text-sm text-(--color-ink)">{USAGE_LABELS[mode]}</span>
                  <span className="font-(family-name:--font-mono) text-sm text-(--color-muted)">
                    {count}
                  </span>
                </li>
              ))}
          </ul>
        </Section>
      )}

      {stats.hosts.length > 0 && (
        <Section title="Where the sites are hosted">
          <ul className="divide-y divide-(--color-rule) border border-(--color-rule) bg-(--color-card)">
            {stats.hosts.map((host) => (
              <li
                key={host.provider}
                className="flex items-baseline justify-between px-4 py-3"
              >
                <span className="text-sm text-(--color-ink)">{host.provider}</span>
                <span className="font-(family-name:--font-mono) text-sm text-(--color-muted)">
                  {host.count}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-(--color-muted)">
            Counted from CNAME targets. Anything self-hosted or unrecognised is
            &ldquo;Other&rdquo; &mdash; the hostname stays out of it.
          </p>
        </Section>
      )}

      {stats.recent.length > 0 && (
        <Section title="Recently claimed">
          <ul className="divide-y divide-(--color-rule) border border-(--color-rule) bg-(--color-card)">
            {stats.recent.map((claim) => (
              <li
                key={claim.name}
                className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-3"
              >
                <a
                  className="font-(family-name:--font-mono) text-sm text-(--color-signal) underline"
                  href={`https://${claim.name}.runs-on.dev`}
                >
                  {claim.name}.runs-on.dev
                </a>
                <span className="font-(family-name:--font-mono) text-xs text-(--color-muted)">
                  @{claim.github} · {day(claim.claimedAt)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </main>
  );
}
