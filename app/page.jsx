import { cookies } from 'next/headers';
import ClaimForm from './claim-form.jsx';
import { readSession } from '../lib/session.js';

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="border-b border-(--color-accent) pb-2 text-lg font-bold text-(--color-accent)">
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Quote({ children }) {
  return <p className="border-l-2 border-(--color-edge) pl-4 text-sm leading-relaxed">{children}</p>;
}

export default async function Home() {
  const raw = (await cookies()).get('session')?.value;
  const session = raw ? readSession(raw, process.env.SESSION_SECRET) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
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
          <li><a href="https://github.com/zordhalo/runs-on.dev">Registry on GitHub</a></li>
          <li><a href="https://github.com/zordhalo/runs-on.dev/blob/main/README.md">How to point your name</a></li>
          <li><a href="https://github.com/zordhalo/runs-on.dev/blob/main/POLICY.md">Policy</a></li>
        </ul>
      </Section>

      <Section title="Report abuse">
        <Quote>
          If a subdomain is phishing, impersonating someone, or serving malware, email
          abuse@runs-on.dev and it will be reclaimed.
        </Quote>
      </Section>

      <footer className="mt-16 border-l-2 border-(--color-edge) pl-4 text-sm text-(--color-muted)">
        <p>© 2026 runs-on.dev — a project by Advance Labs.</p>
      </footer>
    </main>
  );
}
