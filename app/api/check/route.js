import { validateName } from '../../../lib/name.js';
import { isReserved } from '../../../lib/blocklist.js';
import { getRecord } from '../../../lib/registry.js';

export async function GET(request) {
  const name = (new URL(request.url).searchParams.get('name') ?? '').trim().toLowerCase();

  const grammar = validateName(name);
  if (!grammar.ok) return Response.json({ available: false, code: `invalid_${grammar.reason}` });
  if (isReserved(name).reserved) return Response.json({ available: false, code: 'reserved' });

  let existing;
  try {
    existing = await getRecord(name, { token: process.env.REGISTRY_TOKEN });
  } catch (err) {
    const code = err.status === 403 || err.status === 429 ? 'busy' : 'check_failed';
    return Response.json({ available: false, code });
  }
  return Response.json({ available: existing === null, code: existing ? 'taken' : 'available' });
}
