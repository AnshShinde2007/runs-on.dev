import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planDnsChanges } from '../lib/dns.js';

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
