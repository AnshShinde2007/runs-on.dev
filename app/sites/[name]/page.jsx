import { notFound } from 'next/navigation';
import { getRecord } from '../../../lib/registry.js';

// Record freshness, not the GitHub profile's: a name claimed just now must
// stop serving a cached 404 within seconds, not up to an hour.
export const revalidate = 30;

// Wildcard DNS makes every grammar-valid hostname live, so an anonymous curl
// loop over a few thousand names can exhaust the shared registry quota. A
// dedicated card-read token keeps that failure mode from taking down claiming.
const CARD_TOKEN = process.env.CARD_TOKEN ?? process.env.REGISTRY_TOKEN;

async function githubProfile(login) {
  const res = await fetch(`https://api.github.com/users/${login}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${CARD_TOKEN}`,
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchRecord(name) {
  const fetchImpl = (url, init) => fetch(url, { ...init, next: { revalidate: 30 } });
  return getRecord(name, { token: CARD_TOKEN, fetchImpl });
}

export default async function Site({ params }) {
  const { name } = await params;
  const record = await fetchRecord(name);
  if (!record) notFound();

  const profile = await githubProfile(record.owner.github);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <p className="font-(family-name:--font-mono) text-xs tracking-[0.14em] text-(--color-muted) uppercase">
        domains/{name}.json
      </p>

      <div className="mt-4 border border-(--color-rule) bg-(--color-card) p-6 sm:p-8">
        <div className="flex items-center gap-4">
          {profile?.avatar_url && (
            <img
              src={profile.avatar_url}
              alt=""
              width={56}
              height={56}
              className="border border-(--color-rule)"
            />
          )}
          <div>
            <h1 className="font-(family-name:--font-display) text-2xl font-medium tracking-tight text-(--color-ink) sm:text-3xl">
              {name}.runs-on.dev
            </h1>
            {profile?.name && <p className="text-sm text-(--color-muted)">{profile.name}</p>}
          </div>
        </div>

        {profile?.bio && <p className="mt-4 text-sm leading-relaxed">{profile.bio}</p>}

        <dl className="mt-6 space-y-1 border-t border-(--color-rule) pt-4 font-(family-name:--font-mono) text-xs sm:text-[13px]">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-(--color-muted)">owner</dt>
            <dd>
              <a
                className="text-(--color-signal) underline"
                href={`https://github.com/${record.owner.github}`}
              >
                @{record.owner.github}
              </a>
            </dd>
          </div>
          {record.claimedAt && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-(--color-muted)">claimedAt</dt>
              <dd className="text-(--color-ink)">{record.claimedAt}</dd>
            </div>
          )}
        </dl>
      </div>

      <p className="mt-6 text-sm text-(--color-muted)">
        This name is registered on{' '}
        <a className="text-(--color-signal) underline" href="https://runs-on.dev">
          runs-on.dev
        </a>
        . Claim your own.
      </p>
    </main>
  );
}
