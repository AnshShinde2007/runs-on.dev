import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signSession, readSession } from '../lib/session.js';

const secret = 'test-secret-value';

test('round-trips a payload', () => {
  const cookie = signSession({ login: 'zordhalo' }, secret);
  assert.deepEqual(readSession(cookie, secret), { login: 'zordhalo' });
});

test('rejects a tampered payload', () => {
  const cookie = signSession({ login: 'zordhalo' }, secret);
  const [body, sig] = cookie.split('.');
  const forged = `${Buffer.from(JSON.stringify({ login: 'admin' })).toString('base64url')}.${sig}`;
  assert.equal(readSession(forged, secret), null);
});

test('rejects a signature from a different secret', () => {
  const cookie = signSession({ login: 'zordhalo' }, 'other-secret');
  assert.equal(readSession(cookie, secret), null);
});

test('rejects malformed cookies without throwing', () => {
  assert.equal(readSession('', secret), null);
  assert.equal(readSession('no-dot', secret), null);
  assert.equal(readSession('a.b.c', secret), null);
});
