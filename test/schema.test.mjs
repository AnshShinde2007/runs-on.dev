import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord } from '../lib/schema.js';

const valid = {
  name: 'lucas',
  owner: { github: 'zordhalo' },
  claimedAt: '2026-08-30T19:12:04Z',
  records: {},
};

test('accepts a minimal claim record', () => {
  assert.deepEqual(validateRecord(valid), { ok: true, errors: [] });
});

test('accepts CNAME, A and TXT records', () => {
  assert.equal(validateRecord({ ...valid, records: { CNAME: 'lucas.vercel.app' } }).ok, true);
  assert.equal(validateRecord({ ...valid, records: { A: ['76.76.21.21'] } }).ok, true);
  assert.equal(validateRecord({ ...valid, records: { TXT: ['hello'] } }).ok, true);
});

test('rejects unknown top-level keys', () => {
  const out = validateRecord({ ...valid, sneaky: true });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('sneaky')));
});

test('rejects a name that fails grammar', () => {
  assert.equal(validateRecord({ ...valid, name: 'Lucas' }).ok, false);
});

test('rejects a missing owner', () => {
  const { owner, ...rest } = valid;
  assert.equal(validateRecord(rest).ok, false);
});

test('rejects CNAME combined with A', () => {
  const out = validateRecord({ ...valid, records: { CNAME: 'x.example.com', A: ['1.2.3.4'] } });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('CNAME')));
});

test('rejects malformed A records', () => {
  assert.equal(validateRecord({ ...valid, records: { A: ['999.1.1.1'] } }).ok, false);
  assert.equal(validateRecord({ ...valid, records: { A: 'not-an-array' } }).ok, false);
});

test('rejects a non-ISO claimedAt', () => {
  assert.equal(validateRecord({ ...valid, claimedAt: 'yesterday' }).ok, false);
});
