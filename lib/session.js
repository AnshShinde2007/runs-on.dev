import { createHmac, timingSafeEqual } from 'node:crypto';

function sign(body, secret) {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function signSession(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

export function readSession(cookie, secret) {
  if (typeof cookie !== 'string') return null;
  const parts = cookie.split('.');
  if (parts.length !== 2) return null;

  const [body, provided] = parts;
  const expected = sign(body, secret);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
