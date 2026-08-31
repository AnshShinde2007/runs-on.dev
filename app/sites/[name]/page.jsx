import { notFound } from 'next/navigation';
import { getRecord } from '../../../lib/registry.js';

export const revalidate = 3600;

async function githubProfile(login) {
  const res = await fetch(`https://api.github.com/users/${login}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.REGISTRY_TOKEN}`,
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function Site({ params }) {
  const { name } = await params;
  const record = await getRecord(name, { token: process.env.REGISTRY_TOKEN });
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
