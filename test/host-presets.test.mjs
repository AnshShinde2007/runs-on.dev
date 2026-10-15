// The /manage CNAME presets have to agree with providerFor on two things, or
// the form misleads the owner in one of two directions.
//
// Recognition: the chip a returning owner sees is found by matching a
// preset's `label` against what providerFor reads off the stored CNAME, so a
// label that drifts out of providerFor's vocabulary silently stops matching.
//
// Prefill: a preset may only prefill a target this form can actually derive.
// Vercel used to prefill `cname.vercel-dns.com`, its generic documented
// value, when the real target is issued per project — the name resolved,
// Vercel served nothing, and the health check filed a stuck-name issue
// (#323, #328).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '../app/manage/host-presets.js';
import { providerFor } from '../lib/stats.js';

const byId = (id) => PRESETS.find((p) => p.id === id);

// One real target per preset, written the way the provider hands it over.
const TARGETS = {
  'github-pages': ['lucas.github.io', 'some-project.github.io'],
  netlify: ['your-site.netlify.app'],
  'cloudflare-pages': ['your-project.pages.dev'],
  vercel: ['cname.vercel-dns.com', 'ad4ea92dbf7ef906.vercel-dns-017.com'],
  render: ['your-service.onrender.com'],
};

test('every preset is reachable from a stored CNAME', () => {
  for (const [id, targets] of Object.entries(TARGETS)) {
    const preset = byId(id);
    assert.ok(preset, `preset ${id} exists`);
    for (const CNAME of targets) {
      assert.equal(
        providerFor({ CNAME }),
        preset.label,
        `${CNAME} resolves to the ${id} preset's label`,
      );
    }
  }
});

test('every preset has a target in the table above', () => {
  // Otherwise a new preset ships unrecognised and this file never notices.
  assert.deepEqual(PRESETS.map((p) => p.id).sort(), Object.keys(TARGETS).sort());
});

test('only a derivable target may be prefilled', () => {
  // GitHub Pages is the one target this form can compute, from the owner's
  // own login. Everything else is issued per project.
  const prefilling = PRESETS.filter((p) => p.prefillFor).map((p) => p.id);
  assert.deepEqual(prefilling, ['github-pages']);
  assert.equal(byId('github-pages').prefillFor('Lucas'), 'lucas.github.io');
});

test('Vercel does not hand back the generic target', () => {
  const vercel = byId('vercel');
  assert.equal(vercel.prefillFor, null, 'the field starts empty');
  assert.ok(
    !vercel.placeholder.startsWith('cname.'),
    'the placeholder shows the per-project shape, not a value to copy',
  );
  // The step that was missing: nothing told the owner to copy their own
  // target, so the prefilled generic one is what got saved.
  const steps = vercel.steps('you').join(' ').toLowerCase();
  assert.ok(steps.includes('copy the cname target'), 'a step says to copy their own target');
  assert.ok(steps.includes('vc-domain-verify='), 'a step still covers the ownership TXT');
});
