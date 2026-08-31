import { readFile } from 'node:fs/promises';
import { planDnsChanges } from '../lib/dns.js';

const DOMAIN = 'runs-on.dev';
const TOKEN = process.env.VERCEL_TOKEN;
const TEAM = process.env.VERCEL_TEAM_ID;
const changed = (process.env.CHANGED_FILES ?? '').split('\n').filter(Boolean);

const REQUIRED = { VERCEL_TOKEN: TOKEN, VERCEL_TEAM_ID: TEAM };
const missing = Object.entries(REQUIRED)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`sync-dns: missing required environment variable(s): ${missing.join(', ')}`);
  process.exit(1);
}

const vercel = (path, init = {}) =>
  fetch(`https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${TEAM}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  });

async function existingFor(name) {
  const res = await vercel(`/v4/domains/${DOMAIN}/records?limit=100`);
  if (!res.ok) {
    console.error(`sync-dns: failed to list records for ${DOMAIN}: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const { records } = await res.json();
  return records.filter((r) => r.name === name);
}

for (const file of changed) {
  const match = /^domains\/([a-z0-9-]+)\.json$/.exec(file);
  if (!match) continue;

  const name = match[1];
  const record = JSON.parse(await readFile(file, 'utf8'));
  const desired = planDnsChanges(record);

  for (const stale of await existingFor(name)) {
    await vercel(`/v2/domains/records/${stale.id}`, { method: 'DELETE' });
    console.log(`deleted ${stale.type} ${stale.name}`);
  }

  for (const change of desired) {
    const res = await vercel(`/v2/domains/${DOMAIN}/records`, {
      method: 'POST',
      body: JSON.stringify({ type: change.type, name: change.name, value: change.value, ttl: 3600 }),
    });
    if (!res.ok) {
      console.error(`failed to create ${change.type} ${change.name}: ${res.status}`);
      process.exit(1);
    }
    console.log(`created ${change.type} ${change.name} -> ${change.value}`);
  }

  if (desired.length === 0) console.log(`${name}: no records, wildcard serves the profile card`);
}
