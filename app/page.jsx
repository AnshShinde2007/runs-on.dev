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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <JsonLd data={websiteJsonLd} />

      <div className="border border-(--color-edge) bg-(--color-panel) px-6 py-14 text-center">
        <span className="text-4xl tracking-widest text-(--color-accent)">.runs-on.dev</span>
      </div>

      <Section title="runs-on.dev">
        <p className="font-bold">Grab your own free .runs-on.dev subdomain.</p>
        <Quote>
          Claim a name, and it is live in seconds with HTTPS. Point it at your own hosting
          whenever you like by opening a pull request against the public registry.
        </Quote>
        <Quote>
          Free forever. No ads, no tracking, no account beyond the GitHub one you already have.
        </Quote>
      </Section>

      <Section title="Claim a subdomain">
        <ClaimForm signedIn={Boolean(session)} />
      </Section>

      <Section title="Important links">
        <ul className="list-disc space-y-1 pl-6 text-sm text-(--color-accent)">
          <li><a href="/docs">Point your name at your own hosting</a></li>
          <li><a href="/about">About runs-on.dev</a></li>
          <li><a href="/faq">FAQ</a></li>
          <li><a href="/policy">Policy</a></li>
          <li><a href="https://github.com/zordhalo/runs-on.dev">Registry on GitHub</a></li>
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
