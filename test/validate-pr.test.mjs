import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateChangeset } from '../lib/pr.js';

const owned = {
  name: 'lucas',
  owner: { github: 'zordhalo' },
  claimedAt: '2026-08-30T19:12:04Z',
  records: { CNAME: 'lucas.vercel.app' },
};

const base = { ...owned, records: {} };

const readers = (head, baseRec = base) => ({
  readFile: async () => head,
  readBase: async () => baseRec,
});

test('accepts an owner pointing their own name', async () => {
  const out = await validateChangeset({
    files: [{ filename: 'domains/lucas.json', status: 'modified' }],
    prAuthor: 'zordhalo',
    ...readers(owned),
  });
  assert.deepEqual(out, { ok: true, errors: [] });
});

test('rejects editing someone else\'s name', async () => {
  const out = await validateChangeset({
    files: [{ filename: 'domains/lucas.json', status: 'modified' }],
    prAuthor: 'attacker',
    ...readers(owned),
  });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('owner')));
});

test('rejects changing the owner field', async () => {
  const hijack = { ...owned, owner: { github: 'attacker' } };
  const out = await validateChangeset({
    files: [{ filename: 'domains/lucas.json', status: 'modified' }],
    prAuthor: 'attacker',
    ...readers(hijack),
  });
  assert.equal(out.ok, false);
});

test('rejects touching more than one file', async () => {
  const out = await validateChangeset({
    files: [
      { filename: 'domains/lucas.json', status: 'modified' },
      { filename: 'domains/other.json', status: 'modified' },
    ],
    prAuthor: 'zordhalo',
    ...readers(owned),
  });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('one file')));
});

test('rejects files outside domains/', async () => {
  const out = await validateChangeset({
    files: [{ filename: '.github/workflows/validate.yml', status: 'modified' }],
    prAuthor: 'zordhalo',
    ...readers(owned),
  });
  assert.equal(out.ok, false);
});

test('rejects a filename that does not match the record name', async () => {
  const out = await validateChangeset({
    files: [{ filename: 'domains/other.json', status: 'modified' }],
    prAuthor: 'zordhalo',
    ...readers(owned),
  });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('filename')));
});

test('rejects a schema violation', async () => {
  const bad = { ...owned, records: { CNAME: 'x', A: ['1.2.3.4'] } };
  const out = await validateChangeset({
    files: [{ filename: 'domains/lucas.json', status: 'modified' }],
    prAuthor: 'zordhalo',
    ...readers(bad),
  });
  assert.equal(out.ok, false);
});

test('rejects a new file claiming a reserved name', async () => {
  const reserved = { ...owned, name: 'api' };
  const out = await validateChangeset({
    files: [{ filename: 'domains/api.json', status: 'added' }],
    prAuthor: 'zordhalo',
    readFile: async () => reserved,
    readBase: async () => null,
  });
  assert.equal(out.ok, false);
});

test('rejects a renamed file', async () => {
  const out = await validateChangeset({
    files: [{ filename: 'domains/attacker.json', status: 'renamed', previous_filename: 'domains/lucas.json' }],
    prAuthor: 'attacker',
    readFile: async () => ({ ...owned, name: 'attacker', owner: { github: 'attacker' } }),
    readBase: async () => null,
  });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('renam')));
});

test('rejects a rename even when only previous_filename is set', async () => {
  const out = await validateChangeset({
    files: [{ filename: 'domains/attacker.json', status: 'modified', previous_filename: 'domains/lucas.json' }],
    prAuthor: 'attacker',
    readFile: async () => ({ ...owned, name: 'attacker', owner: { github: 'attacker' } }),
    readBase: async () => null,
  });
  assert.equal(out.ok, false);
});
