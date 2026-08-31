import { readSession } from '../../../lib/session.js';
import { evaluateClaim } from '../../../lib/claim.js';
import { putRecord } from '../../../lib/registry.js';

const TOKEN = () => process.env.REGISTRY_TOKEN;

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim().toLowerCase() : '';

  const cookie = request.headers.get('cookie') ?? '';
  const raw = cookie.match(/(?:^|;\s*)session=([^;]+)/)?.[1];
  const session = raw ? readSession(raw, process.env.SESSION_SECRET) : null;

  // No pre-flight existence check: putRecord's atomic create already answers
  // "taken" via its `exists` reason, at the same status/code, for one less
  // GitHub request. It also degrades safely under rate limiting, unlike a
  // pre-flight getRecord call which throws on 403/429.
  const decision = evaluateClaim({ name, session, existing: null });
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
