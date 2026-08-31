import { Section, Quote } from '../components/Section.jsx';

export const metadata = {
  title: 'Point your name at your own hosting',
  description:
    'How to edit a claimed runs-on.dev record and route it to Vercel, GitHub Pages, Netlify, or Cloudflare Pages, with copy-paste examples.',
  alternates: { canonical: 'https://runs-on.dev/docs' },
  openGraph: { title: 'Point your name at your own hosting — runs-on.dev' },
};

function Code({ children }) {
  return (
    <pre className="overflow-x-auto border border-(--color-edge) bg-(--color-panel) p-4 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

export default function Docs() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-(--color-accent)">Point your name at your own hosting</h1>
      <p className="mt-4 text-sm text-(--color-muted)">
        By default a claimed name serves a small profile card built from your GitHub account.
        Pointing it at your own site is a two-file edit and a pull request, no DNS panel
        involved.
      </p>

      <Section title="The flow">
        <ol className="list-decimal space-y-2 pl-6 text-sm leading-relaxed">
          <li>Fork <a className="text-(--color-accent)" href="https://github.com/zordhalo/runs-on.dev">the registry</a>.</li>
          <li>
            Edit <code className="text-(--color-accent)">domains/&lt;name&gt;.json</code>, adding a
            <code className="text-(--color-accent)"> CNAME</code>, <code className="text-(--color-accent)">A</code>, or
            <code className="text-(--color-accent)"> TXT</code> record under <code className="text-(--color-accent)">records</code>.
          </li>
          <li>
            Open a pull request. CI validates the change against the record schema; once it is
            green and merged, a workflow pushes the record to DNS automatically.
          </li>
        </ol>
        <Quote>
          One file per pull request, and the path must match
          <code className="text-(--color-accent)"> domains/&lt;name&gt;.json</code>. Only the recorded owner may edit
          their own record.
        </Quote>
      </Section>

      <Section title="Vercel">
        <Code>{`{
  "name": "you",
  "owner": { "github": "you" },
  "claimedAt": "2026-01-01T00:00:00.000Z",
  "records": { "CNAME": "cname.vercel-dns.com" }
}`}</Code>
        <p className="text-sm leading-relaxed">
          Add <code className="text-(--color-accent)">you.runs-on.dev</code> as a custom domain on the Vercel
          project (Project → Settings → Domains). It shows this exact CNAME target.
        </p>
      </Section>

      <Section title="GitHub Pages">
        <Code>{`{
  "name": "you",
  "owner": { "github": "you" },
  "claimedAt": "2026-01-01T00:00:00.000Z",
  "records": { "CNAME": "you.github.io" }
}`}</Code>
        <p className="text-sm leading-relaxed">
          Replace <code className="text-(--color-accent)">you</code> with your GitHub username or org. You also
          need a <code className="text-(--color-accent)">CNAME</code> file in the Pages repo itself containing
          <code className="text-(--color-accent)"> you.runs-on.dev</code>, GitHub's usual custom-domain setup.
        </p>
      </Section>

      <Section title="Netlify">
        <Code>{`{
  "name": "you",
  "owner": { "github": "you" },
  "claimedAt": "2026-01-01T00:00:00.000Z",
  "records": { "CNAME": "apex-loadbalancer.netlify.com" }
}`}</Code>
        <p className="text-sm leading-relaxed">
          Add <code className="text-(--color-accent)">you.runs-on.dev</code> as a custom domain in the Netlify
          site's settings so it can issue a certificate for it.
        </p>
      </Section>

      <Section title="Cloudflare Pages">
        <Code>{`{
  "name": "you",
  "owner": { "github": "you" },
  "claimedAt": "2026-01-01T00:00:00.000Z",
  "records": { "CNAME": "you-project.pages.dev" }
}`}</Code>
        <p className="text-sm leading-relaxed">
          Replace <code className="text-(--color-accent)">you-project</code> with your Pages project's own
          <code className="text-(--color-accent)"> *.pages.dev</code> subdomain, then add
          <code className="text-(--color-accent)"> you.runs-on.dev</code> as a custom domain in the Pages
          project's settings.
        </p>
      </Section>

      <Section title="A and TXT records">
        <p className="text-sm leading-relaxed">
          A CNAME can't sit next to an A or TXT record at the same name, that's a DNS
          constraint, not a rule this registry invented. If you need both a routing target and
          a verification string (a domain-verification TXT, for example), use
          <code className="text-(--color-accent)"> A</code> with your host's IP addresses instead of
          <code className="text-(--color-accent)"> CNAME</code>, since A and TXT can coexist.
        </p>
        <Code>{`"records": {
  "A": ["203.0.113.10"],
  "TXT": ["verification-string-here"]
}`}</Code>
      </Section>

      <Section title="Full reference">
        <p className="text-sm leading-relaxed">
          Field-by-field detail, validation rules, and how a merged record actually reaches
          DNS: <a className="text-(--color-accent)" href="https://github.com/zordhalo/runs-on.dev/blob/main/docs/records.md">docs/records.md</a> in
          the registry.
        </p>
      </Section>
    </main>
  );
}
