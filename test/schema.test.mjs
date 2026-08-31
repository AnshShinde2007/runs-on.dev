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

test('accepts a valid https URL redirect', () => {
  const out = validateRecord({ ...valid, records: { URL: 'https://github.com/zordhalo' } });
  assert.deepEqual(out, { ok: true, errors: [] });
});

test('accepts a valid http URL redirect', () => {
  assert.equal(validateRecord({ ...valid, records: { URL: 'http://example.com' } }).ok, true);
});

test('rejects a javascript: URL', () => {
  const out = validateRecord({ ...valid, records: { URL: 'javascript:alert(1)' } });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('URL')));
});

test('rejects a data: URL', () => {
  assert.equal(validateRecord({ ...valid, records: { URL: 'data:text/html,<script>' } }).ok, false);
});

test('rejects a vbscript: URL', () => {
  assert.equal(validateRecord({ ...valid, records: { URL: 'vbscript:msgbox(1)' } }).ok, false);
});

test('rejects a protocol-relative URL', () => {
  assert.equal(validateRecord({ ...valid, records: { URL: '//evil.com' } }).ok, false);
});

test('rejects a URL that fails new URL()', () => {
  assert.equal(validateRecord({ ...valid, records: { URL: 'not a url' } }).ok, false);
});

test('rejects URL alongside another record type', () => {
  const out = validateRecord({ ...valid, records: { URL: 'https://example.com', TXT: ['hi'] } });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('URL')));
});

test('accepts MX alone', () => {
  const out = validateRecord({
    ...valid,
    records: { MX: [{ priority: 10, value: 'mx1.example.com' }] },
  });
  assert.deepEqual(out, { ok: true, errors: [] });
});

test('accepts MX alongside A and TXT', () => {
  const out = validateRecord({
    ...valid,
    records: {
      A: ['1.2.3.4'],
      TXT: ['hello'],
      MX: [{ priority: 10, value: 'mx1.example.com' }],
    },
  });
  assert.equal(out.ok, true);
});

test('rejects MX alongside CNAME', () => {
  const out = validateRecord({
    ...valid,
    records: { CNAME: 'x.example.com', MX: [{ priority: 10, value: 'mx1.example.com' }] },
  });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('CNAME')));
});

test('rejects MX with a bad priority', () => {
  const tooHigh = validateRecord({
    ...valid,
    records: { MX: [{ priority: 70000, value: 'mx1.example.com' }] },
  });
  assert.equal(tooHigh.ok, false);

  const negative = validateRecord({
    ...valid,
    records: { MX: [{ priority: -1, value: 'mx1.example.com' }] },
  });
  assert.equal(negative.ok, false);

  const nonInteger = validateRecord({
    ...valid,
    records: { MX: [{ priority: 1.5, value: 'mx1.example.com' }] },
  });
  assert.equal(nonInteger.ok, false);
});

test('rejects an empty MX array', () => {
  assert.equal(validateRecord({ ...valid, records: { MX: [] } }).ok, false);
});

test('rejects more than 5 MX entries', () => {
  const mx = Array.from({ length: 6 }, (_, i) => ({ priority: i, value: 'mx.example.com' }));
  assert.equal(validateRecord({ ...valid, records: { MX: mx } }).ok, false);
});

test('accepts a valid subdomains entry', () => {
  const out = validateRecord({
    ...valid,
    subdomains: { _atproto: { TXT: ['did=did:plc:abc123'] } },
  });
  assert.deepEqual(out, { ok: true, errors: [] });
});

test('rejects a subdomain label with a dot', () => {
  const out = validateRecord({
    ...valid,
    subdomains: { 'foo.bar': { TXT: ['hello'] } },
  });
  assert.equal(out.ok, false);
});

test('rejects a subdomain holding URL', () => {
  const out = validateRecord({
    ...valid,
    subdomains: { blog: { URL: 'https://example.com' } },
  });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('URL')));
});

test('rejects more than 10 subdomains', () => {
  const subdomains = {};
  for (let i = 0; i < 11; i += 1) subdomains[`sub${i}`] = { TXT: ['hi'] };
  assert.equal(validateRecord({ ...valid, subdomains }).ok, false);
});

test('accepts exactly 10 subdomains', () => {
  const subdomains = {};
  for (let i = 0; i < 10; i += 1) subdomains[`sub${i}`] = { TXT: ['hi'] };
  assert.equal(validateRecord({ ...valid, subdomains }).ok, true);
});

test('rejects a subdomain CNAME alongside A', () => {
  const out = validateRecord({
    ...valid,
    subdomains: { blog: { CNAME: 'x.example.com', A: ['1.2.3.4'] } },
  });
  assert.equal(out.ok, false);
});

test('accepts a subdomain MX alongside A', () => {
  const out = validateRecord({
    ...valid,
    subdomains: {
      mail: { A: ['1.2.3.4'], MX: [{ priority: 10, value: 'mx1.example.com' }] },
    },
  });
  assert.equal(out.ok, true);
});
