import { validateRecord } from './schema.js';

const REPO = process.env.REGISTRY_REPO ?? 'zordhalo/runs-on.dev';
const API = 'https://api.github.com';

function pathFor(name) {
  return `domains/${name}.json`;
}

function headers(token) {
  const h = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function getRecord(name, { fetchImpl = fetch, token } = {}) {
  const res = await fetchImpl(`${API}/repos/${REPO}/contents/${pathFor(name)}`, {
    headers: headers(token),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = new Error(`registry read failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const body = await res.json();
  return JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
}

export async function putRecord(record, { token, fetchImpl = fetch } = {}) {
  if (!validateRecord(record).ok) return { ok: false, reason: 'error' };

  // Reuse the authenticated token for this existence check: anonymous GitHub
  // reads cap at 60/hour vs 5,000/hour authenticated, so during a launch
  // spike an anonymous check would falsely report every name as available.
  let existing;
  try {
    existing = await getRecord(record.name, { fetchImpl, token });
  } catch (err) {
    return {
      ok: false,
      reason: err.status === 403 || err.status === 429 ? 'ratelimited' : 'error',
    };
  }
  if (existing) return { ok: false, reason: 'exists' };

  const res = await fetchImpl(`${API}/repos/${REPO}/contents/${pathFor(record.name)}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `claim: ${record.name} by @${record.owner.github}`,
      content: Buffer.from(`${JSON.stringify(record, null, 2)}\n`).toString('base64'),
    }),
  });

  if (res.status === 403 || res.status === 429) return { ok: false, reason: 'ratelimited' };
  // No sha is sent on this create, so GitHub rejects a write over a path that
  // now exists (409 or 422) — the safety property that stops overwrites. If
  // another claim won the read-then-write race after our existence check
  // above, that's just a name taken a second ago, not a server error.
  if (res.status === 409 || res.status === 422) return { ok: false, reason: 'exists' };
  if (!res.ok) return { ok: false, reason: 'error' };
  return { ok: true };
}
