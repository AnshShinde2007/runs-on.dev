import { validateName } from '../../../lib/name.js';
import { isReserved } from '../../../lib/blocklist.js';
import { getRecord } from '../../../lib/registry.js';

export async function GET(request) {
  const name = new URL(request.url).searchParams.get('name') ?? '';

  const grammar = validateName(name);
  if (!grammar.ok) return Response.json({ available: false, code: `invalid_${grammar.reason}` });
  if (isReserved(name).reserved) return Response.json({ available: false, code: 'reserved' });

  const existing = await getRecord(name, { token: process.env.REGISTRY_TOKEN });
  return Response.json({ available: existing === null, code: existing ? 'taken' : 'available' });
}
