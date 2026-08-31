import { readSession } from '../../../lib/session.js';
import { evaluateClaim } from '../../../lib/claim.js';
import { getRecord, putRecord } from '../../../lib/registry.js';
import { validateName } from '../../../lib/name.js';
import { isReserved } from '../../../lib/blocklist.js';

const TOKEN = () => process.env.REGISTRY_TOKEN;

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim().toLowerCase() : '';

  const cookie = request.headers.get('cookie') ?? '';
  const raw = cookie.match(/(?:^|;\s*)session=([^;]+)/)?.[1];
  const session = raw ? readSession(raw, process.env.SESSION_SECRET) : null;

  // Validate before spending a GitHub API call. An unvalidated name would otherwise
  // reach getRecord and burn quota from the same budget the write path depends on.
  const worthChecking = validateName(name).ok && !isReserved(name).reserved;
  const existing = session && worthChecking ? await getRecord(name, { token: TOKEN() }) : null;
  const decision = evaluateClaim({ name, session, existing });
  if (!decision.ok) {
    return Response.json({ error: decision.code }, { status: decision.status });
  }

  const result = await putRecord(decision.record, { token: TOKEN() });

  if (result.ok) return Response.json({ claimed: name });

  if (result.reason === 'exists') {
    return Response.json({ error: 'taken' }, { status: 409 });
  }

  if (result.reason === 'ratelimited') {
    return Response.json(
      { error: 'busy', retryInMs: 4000 },
      { status: 503, headers: { 'Retry-After': '4' } },
    );
  }

  return Response.json({ error: 'server_error' }, { status: 500 });
}
