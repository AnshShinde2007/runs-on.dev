import { notFound, redirect } from 'next/navigation';
import { getRecord } from '../../../lib/registry.js';
import { isValidRedirectUrl } from '../../../lib/schema.js';
import { cardMetadata } from '../../../lib/metadata.js';

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

// Both this and the page below read the record and the GitHub profile. Next
// memoises identical fetches across generateMetadata and the render for one
// request, and both calls go through the same helpers with the same options,
// so a card still costs one registry read and one profile read, not two of
// each. That matters here specifically: these reads come out of CARD_TOKEN's
// hourly quota, which the wildcard makes trivially easy to exhaust.
export async function generateMetadata({ params }) {
  const { name } = await params;
  const record = await fetchRecord(name);
  if (!record) return { title: { absolute: 'Not found' }, robots: { index: false } };

  const profile = await githubProfile(record.owner.github);
  return cardMetadata({ name, record, profile });
}

export default async function Site({ params }) {
  const { name } = await params;
  const record = await fetchRecord(name);
  if (!record) notFound();

  const records = record.records ?? {};
  if (records.URL && Object.keys(records).length === 1) {
    // Re-validate at render time, not just at CI review time: the record
    // could have been merged before this rule existed or before it
    // tightened, and this is an open-redirect surface on a trusted domain.
    // Plain redirect() (not permanentRedirect) answers with a 307 here,
    // preserving method and intent and telling browsers not to cache the
    // redirect permanently, unlike a 301/308.
    if (!isValidRedirectUrl(records.URL)) notFound();
    redirect(records.URL);
  }

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
