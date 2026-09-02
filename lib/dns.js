function planFor(name, records, changes) {
  if (records.CNAME) changes.push({ type: 'CNAME', name, value: records.CNAME });
  for (const value of records.A ?? []) changes.push({ type: 'A', name, value });
  for (const value of records.TXT ?? []) changes.push({ type: 'TXT', name, value });
  for (const mx of records.MX ?? []) {
    changes.push({ type: 'MX', name, value: mx.value, priority: mx.priority });
  }
  // URL redirects are served by the app itself off the wildcard record, so
  // they plan no DNS change at all.
}

export function planDnsChanges(record) {
  const changes = [];
  const { name, records = {}, subdomains = {} } = record;

  planFor(name, records, changes);

  for (const [label, subRecords] of Object.entries(subdomains)) {
    planFor(`${label}.${name}`, subRecords, changes);
  }

  return changes;
}

// Vercel's DNS REST endpoints, kept here rather than inline in the sync script
// so the paths themselves are under test. The delete path is the reason: it is
// `/v2/domains/{domain}/records/{recordId}`, and a version missing the
// `{domain}` segment returns 404 for every record that exists, which reads as
// "already gone" but is really "wrong URL".
//
// Listing stays on v4 deliberately. v5 is current, but v4 is what this zone has
// been paginated with in production; moving versions is a separate, verifiable
// change and not part of fixing the delete.
export function listPath(domain, cursor = '') {
  const base = `/v4/domains/${domain}/records?limit=100`;
  return cursor ? `${base}&until=${cursor}` : base;
}

export function createPath(domain) {
  return `/v2/domains/${domain}/records`;
}

export function removePath(domain, recordId) {
  return `/v2/domains/${domain}/records/${encodeURIComponent(recordId)}`;
}
