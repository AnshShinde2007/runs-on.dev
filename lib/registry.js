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
  if (!res.ok) throw new Error(`registry read failed: ${res.status}`);
  const body = await res.json();
  return JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
}

export async function putRecord(record, { token, fetchImpl = fetch } = {}) {
  if (!validateRecord(record).ok) return { ok: false, reason: 'error' };

  // Reuse the authenticated token for this existence check: anonymous GitHub
  // reads cap at 60/hour vs 5,000/hour authenticated, so during a launch
  // spike an anonymous check would falsely report every name as available.
  const existing = await getRecord(record.name, { fetchImpl, token });
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
  if (!res.ok) return { ok: false, reason: 'error' };
  return { ok: true };
}
