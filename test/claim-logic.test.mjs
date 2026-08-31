import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateClaim } from '../lib/claim.js';

const now = new Date('2026-08-30T00:00:00Z');
const session = {
  login: 'zordhalo',
  createdAt: '2020-01-01T00:00:00Z',
  publicRepos: 5,
};

test('produces a record for a good claim', () => {
  const out = evaluateClaim({ name: 'lucas', session, existing: null, now });
  assert.equal(out.ok, true);
  assert.deepEqual(out.record, {
    name: 'lucas',
    owner: { github: 'zordhalo' },
    claimedAt: now.toISOString(),
    records: {},
  });
});

test('requires a session', () => {
  const out = evaluateClaim({ name: 'lucas', session: null, existing: null, now });
  assert.deepEqual(out, { ok: false, status: 401, code: 'signin_required' });
});

test('rejects a bad name', () => {
  assert.equal(evaluateClaim({ name: 'Lucas', session, existing: null, now }).code, 'invalid_name');
});

test('rejects a reserved name', () => {
  assert.equal(evaluateClaim({ name: 'api', session, existing: null, now }).code, 'reserved');
});

test('rejects a taken name', () => {
  const existing = { name: 'lucas', owner: { github: 'someone' } };
  const out = evaluateClaim({ name: 'lucas', session, existing, now });
  assert.deepEqual(out, { ok: false, status: 409, code: 'taken' });
});

test('rejects an ineligible account', () => {
  const fresh = { ...session, createdAt: '2026-08-25T00:00:00Z' };
  assert.equal(evaluateClaim({ name: 'lucas', session: fresh, existing: null, now }).code, 'ineligible_age');
});

test('rejects an account with no public repos', () => {
  const bare = { ...session, publicRepos: 0 };
  assert.equal(evaluateClaim({ name: 'lucas', session: bare, existing: null, now }).code, 'ineligible_repos');
});

test('allows a claim at ownedCount 0', () => {
  const out = evaluateClaim({ name: 'lucas', session, existing: null, now, ownedCount: 0 });
  assert.equal(out.ok, true);
});

test('rejects a claim at the per-account limit', () => {
  const out = evaluateClaim({ name: 'lucas', session, existing: null, now, ownedCount: 1 });
  assert.deepEqual(out, { ok: false, status: 403, code: 'limit_reached' });
});

test('checks the limit after eligibility, so an ineligible account at the limit reports the eligibility reason', () => {
  const fresh = { ...session, createdAt: '2026-08-25T00:00:00Z' };
  const out = evaluateClaim({ name: 'lucas', session: fresh, existing: null, now, ownedCount: 1 });
  assert.equal(out.code, 'ineligible_age');
});

test('checks the limit before the existing/taken check', () => {
  const existing = { name: 'lucas', owner: { github: 'someone' } };
  const out = evaluateClaim({ name: 'lucas', session, existing, now, ownedCount: 1 });
  assert.deepEqual(out, { ok: false, status: 403, code: 'limit_reached' });
});
