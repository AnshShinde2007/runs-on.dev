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
