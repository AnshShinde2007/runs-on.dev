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
    <main className="mx-auto max-w-2xl px-6 py-20">
      <div className="border border-(--color-edge) bg-(--color-panel) p-8">
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt=""
            width={72}
            height={72}
            className="border border-(--color-edge)"
          />
        )}
        <h1 className="mt-6 text-2xl text-(--color-accent)">{name}.runs-on.dev</h1>
        {profile?.name && <p className="mt-2">{profile.name}</p>}
        {profile?.bio && <p className="mt-2 text-sm text-(--color-muted)">{profile.bio}</p>}
        <p className="mt-6 text-sm">
          claimed by{' '}
          <a className="text-(--color-accent)" href={`https://github.com/${record.owner.github}`}>
            @{record.owner.github}
          </a>
        </p>
      </div>

      <p className="mt-6 border-l-2 border-(--color-edge) pl-4 text-sm text-(--color-muted)">
        This name is registered on{' '}
        <a className="text-(--color-accent)" href="https://runs-on.dev">runs-on.dev</a>. Claim your own.
      </p>
    </main>
  );
}
