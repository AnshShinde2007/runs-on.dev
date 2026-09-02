import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planDnsChanges, listPath, createPath, removePath } from '../lib/dns.js';

const base = { name: 'lucas', owner: { github: 'zordhalo' }, claimedAt: '2026-08-30T00:00:00Z' };

test('an empty records object plans no changes', () => {
  assert.deepEqual(planDnsChanges({ ...base, records: {} }), []);
});

test('plans a CNAME', () => {
  assert.deepEqual(planDnsChanges({ ...base, records: { CNAME: 'lucas.vercel.app' } }), [
    { type: 'CNAME', name: 'lucas', value: 'lucas.vercel.app' },
  ]);
});

test('plans one entry per A address', () => {
  assert.deepEqual(planDnsChanges({ ...base, records: { A: ['1.2.3.4', '5.6.7.8'] } }), [
    { type: 'A', name: 'lucas', value: '1.2.3.4' },
    { type: 'A', name: 'lucas', value: '5.6.7.8' },
  ]);
});

test('plans TXT entries', () => {
  assert.deepEqual(planDnsChanges({ ...base, records: { TXT: ['v=spf1 -all'] } }), [
    { type: 'TXT', name: 'lucas', value: 'v=spf1 -all' },
  ]);
});

test('plans MX entries with priority', () => {
  assert.deepEqual(
    planDnsChanges({
      ...base,
      records: { MX: [{ priority: 10, value: 'mx1.example.com' }, { priority: 20, value: 'mx2.example.com' }] },
    }),
    [
      { type: 'MX', name: 'lucas', value: 'mx1.example.com', priority: 10 },
      { type: 'MX', name: 'lucas', value: 'mx2.example.com', priority: 20 },
    ],
  );
});

test('a URL record plans no DNS change', () => {
  assert.deepEqual(planDnsChanges({ ...base, records: { URL: 'https://example.com' } }), []);
});

test('plans a nested subdomain TXT record as <label>.<name>', () => {
  assert.deepEqual(
    planDnsChanges({
      ...base,
      records: {},
      subdomains: { _atproto: { TXT: ['did=did:plc:abc123'] } },
    }),
    [{ type: 'TXT', name: '_atproto.lucas', value: 'did=did:plc:abc123' }],
  );
});

test('plans both root and nested subdomain records together', () => {
  assert.deepEqual(
    planDnsChanges({
      ...base,
      records: { CNAME: 'lucas.vercel.app' },
      subdomains: { _discord: { TXT: ['verify=abc'] } },
    }),
    [
      { type: 'CNAME', name: 'lucas', value: 'lucas.vercel.app' },
      { type: 'TXT', name: '_discord.lucas', value: 'verify=abc' },
    ],
  );
});

// The Vercel DNS endpoint paths. These lived as inline template strings in
// scripts/sync-dns.mjs, where nothing could assert them: the delete path was
// missing its {domain} segment, so every delete 404'd from the day it was
// written and the sync only stayed green while no name had records to replace.
test('listPath asks for the domain\'s records, a page at a time', () => {
  assert.equal(listPath('runs-on.dev'), '/v4/domains/runs-on.dev/records?limit=100');
  assert.equal(
    listPath('runs-on.dev', 'abc123'),
    '/v4/domains/runs-on.dev/records?limit=100&until=abc123',
  );
});

test('createPath posts under the domain', () => {
  assert.equal(createPath('runs-on.dev'), '/v2/domains/runs-on.dev/records');
});

test('removePath includes the domain, not just the record id', () => {
  assert.equal(removePath('runs-on.dev', 'rec_abc'), '/v2/domains/runs-on.dev/records/rec_abc');
});
