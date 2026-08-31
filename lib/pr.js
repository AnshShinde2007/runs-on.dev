import { validateName } from './name.js';
import { isReserved } from './blocklist.js';
import { validateRecord } from './schema.js';

const DOMAIN_FILE = /^domains\/([a-z0-9-]+)\.json$/;

export async function validateChangeset({ files, prAuthor, readFile, readBase }) {
  const errors = [];

  if (!Array.isArray(files) || files.length !== 1) {
    return { ok: false, errors: ['a pull request must change exactly one file'] };
  }

  const [file] = files;

  // A rename arrives as ONE file entry carrying only the new path, so without this the
  // changeset falls into the new-record branch and never checks who owned the old file.
  // That lets anyone rename someone else's record into a name they own, deleting the
  // victim's registration with no ownership check at all.
  if (file.status === 'renamed' || file.previous_filename) {
    return { ok: false, errors: ['renaming a record is not allowed'] };
  }

  const match = DOMAIN_FILE.exec(file.filename);
  if (!match) {
    return { ok: false, errors: [`only domains/<name>.json may be changed, got ${file.filename}`] };
  }

  const nameFromPath = match[1];
  const head = await readFile(file.filename);
  if (!head) return { ok: false, errors: ['could not read the changed file'] };

  const schema = validateRecord(head);
  if (!schema.ok) errors.push(...schema.errors);

  if (!validateName(nameFromPath).ok) errors.push('filename fails the name grammar');
  if (head.name !== nameFromPath) errors.push('filename must match the record name');

  const base = await readBase(file.filename);

  if (base) {
    if (base.owner?.github !== prAuthor) {
      errors.push(`only the owner (@${base.owner?.github}) may change this record`);
    }
    if (head.owner?.github !== base.owner?.github) {
      errors.push('owner cannot be changed by pull request');
    }
    if (head.claimedAt !== base.claimedAt) {
      errors.push('claimedAt cannot be changed');
    }
  } else {
    if (isReserved(nameFromPath).reserved) errors.push('that name is reserved');
    if (head.owner?.github !== prAuthor) {
      errors.push('a new record must be owned by the pull request author');
    }
  }

  return { ok: errors.length === 0, errors };
}
