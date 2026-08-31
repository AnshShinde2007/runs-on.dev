import { cookies } from 'next/headers';
import ClaimForm from './claim-form.jsx';
import JsonLd from './components/JsonLd.jsx';
import { Section, Quote } from './components/Section.jsx';
import { readSession } from '../lib/session.js';

export const metadata = {
  title: 'runs-on.dev — free subdomains',
  description: 'Claim your own name.runs-on.dev in seconds. Free, forever.',
  alternates: { canonical: 'https://runs-on.dev' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://runs-on.dev/#website',
      url: 'https://runs-on.dev',
      name: 'runs-on.dev',
      description: 'A free subdomain registry. Claim your own name.runs-on.dev in seconds.',
      publisher: { '@id': 'https://advancelabs.dev/#organization' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://advancelabs.dev/#organization',
      name: 'Advance Labs',
      url: 'https://advancelabs.dev',
    },
  ],
};

export default async function Home() {
  const raw = (await cookies()).get('session')?.value;
  const session = raw ? readSession(raw, process.env.SESSION_SECRET) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
      <JsonLd data={websiteJsonLd} />

      <h1 className="sr-only">runs-on.dev — a free subdomain registry</h1>

      <p className="font-(family-name:--font-mono) text-xs tracking-[0.14em] text-(--color-muted) uppercase">
        A free subdomain registry
      </p>

      <div className="mt-6">
        <ClaimForm signedIn={Boolean(session)} />
      </div>

      <Section title="What this is">
        <p className="text-sm leading-relaxed sm:text-base">
          Claiming a name writes a JSON file to a public repo. That file is the record: it says
          the name is yours, and it is the only thing that makes <span className="font-(family-name:--font-mono)">*.runs-on.dev</span> resolve.
          No hidden database, nothing you can't read yourself.
        </p>
        <Quote>
          Live in seconds with HTTPS. Point it at your own hosting whenever you like by opening
          a pull request against the public registry.
        </Quote>
        <Quote>
          Free forever. No ads, no tracking, no account beyond the GitHub one you already have.
        </Quote>
      </Section>

      <Section title="Important links">
        <ul className="space-y-1.5 text-sm sm:text-base">
          <li><a className="text-(--color-signal) underline" href="/docs">Point your name at your own hosting</a></li>
          <li><a className="text-(--color-signal) underline" href="/about">About runs-on.dev</a></li>
          <li><a className="text-(--color-signal) underline" href="/faq">FAQ</a></li>
          <li><a className="text-(--color-signal) underline" href="/policy">Policy</a></li>
          <li><a className="text-(--color-signal) underline" href="https://github.com/zordhalo/runs-on.dev">Registry on GitHub</a></li>
        </ul>
      </Section>

      <Section title="Report abuse">
        <Quote>
          If a subdomain is phishing, impersonating someone, or serving malware, email
          abuse@runs-on.dev and it will be reclaimed.
        </Quote>
      </Section>
    </main>
  );
}
