import { Section } from '../components/Section.jsx';
import { loadPolicy, parseInline } from '../../lib/policy.js';

export const metadata = {
  title: 'Policy',
  description:
    'The terms for runs-on.dev in plain language: names are free and may be reclaimed, what forfeits a name immediately, and how to report abuse.',
  alternates: { canonical: 'https://runs-on.dev/policy' },
  openGraph: { title: 'Policy — runs-on.dev' },
};

const REPO_BLOB = 'https://github.com/zordhalo/runs-on.dev/blob/main/';

function resolveHref(href) {
  return href.startsWith('http') ? href : REPO_BLOB + href;
}

function Inline({ text }) {
  return parseInline(text).map((part, i) => {
    if (part.bold) return <strong key={i}>{part.bold}</strong>;
    if (part.link)
      return (
        <a key={i} className="text-(--color-signal) underline" href={resolveHref(part.href)}>
          {part.link}
        </a>
      );
    return <span key={i}>{part.text}</span>;
  });
}

export default function Policy() {
  const sections = loadPolicy();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-(family-name:--font-display) text-3xl font-medium tracking-tight text-(--color-ink) sm:text-4xl">Policy</h1>
      <p className="mt-4 text-sm leading-relaxed">
        This page is rendered from{' '}
        <a
          className="text-(--color-signal) underline"
          href="https://github.com/zordhalo/runs-on.dev/blob/main/POLICY.md"
        >
          POLICY.md
        </a>{' '}
        in the registry, which is the canonical copy. If the two ever disagree, the repo file
        wins.
      </p>

      {sections.map((section) => (
        <Section title={section.title} key={section.title}>
          {section.blocks.map((block, i) =>
            block.type === 'list' ? (
              <ul className="list-disc space-y-1 pl-6 text-sm leading-relaxed" key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed" key={i}>
                <Inline text={block.text} />
              </p>
            ),
          )}
        </Section>
      ))}
    </main>
  );
}
