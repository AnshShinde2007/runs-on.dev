export function planDnsChanges(record) {
  const changes = [];
  const { name, records = {} } = record;

  if (records.CNAME) changes.push({ type: 'CNAME', name, value: records.CNAME });
  for (const value of records.A ?? []) changes.push({ type: 'A', name, value });
  for (const value of records.TXT ?? []) changes.push({ type: 'TXT', name, value });

  return changes;
}
