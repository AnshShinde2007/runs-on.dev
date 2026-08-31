import { validateName } from './name.js';

const TOP_LEVEL = new Set(['name', 'owner', 'claimedAt', 'records']);
const RECORD_TYPES = new Set(['CNAME', 'A', 'TXT']);
const HOSTNAME = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

function isIPv4(value) {
  const parts = String(value).split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
}

export function validateRecord(obj) {
  const errors = [];
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, errors: ['record must be an object'] };
  }

  for (const key of Object.keys(obj)) {
    if (!TOP_LEVEL.has(key)) errors.push(`unknown key: ${key}`);
  }

  if (!validateName(obj.name).ok) errors.push('name fails grammar');

  if (!obj.owner || typeof obj.owner.github !== 'string' || !obj.owner.github) {
    errors.push('owner.github is required');
  }

  if (typeof obj.claimedAt !== 'string' || Number.isNaN(Date.parse(obj.claimedAt))) {
    errors.push('claimedAt must be an ISO 8601 timestamp');
  }

  const records = obj.records;
  if (records === null || typeof records !== 'object' || Array.isArray(records)) {
    errors.push('records must be an object');
    return { ok: false, errors };
  }

  for (const key of Object.keys(records)) {
    if (!RECORD_TYPES.has(key)) errors.push(`unknown record type: ${key}`);
  }

  if ('CNAME' in records && ('A' in records || 'TXT' in records)) {
    errors.push('CNAME cannot coexist with other record types');
  }

  if ('CNAME' in records && !HOSTNAME.test(String(records.CNAME))) {
    errors.push('CNAME must be a hostname');
  }

  if ('A' in records) {
    if (!Array.isArray(records.A) || records.A.length === 0) {
      errors.push('A must be a non-empty array');
    } else if (!records.A.every(isIPv4)) {
      errors.push('A entries must be IPv4 addresses');
    }
  }

  if ('TXT' in records) {
    const ok = Array.isArray(records.TXT)
      && records.TXT.length > 0
      && records.TXT.every((v) => typeof v === 'string' && v.length <= 255);
    if (!ok) errors.push('TXT must be an array of strings up to 255 chars');
  }

  return { ok: errors.length === 0, errors };
}
