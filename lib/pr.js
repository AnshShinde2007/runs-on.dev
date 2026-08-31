import { validateName } from './name.js';
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
  const base = await readBase(file.filename);

  // POLICY.md promises phishing/malware names get pulled without notice, which
  // requires an owner (or a maintainer) to be able to release a name by PR. The
  // head file no longer exists once removed, so this must branch before readFile.
  if (file.status === 'removed') {
    if (!base) return { ok: false, errors: ['could not read the record being removed'] };
    if (base.owner?.github !== prAuthor) {
      errors.push(`only the owner (@${base.owner?.github}) may remove this record`);
    }
    return { ok: errors.length === 0, errors };
  }

  const head = await readFile(file.filename);
  if (!head) return { ok: false, errors: ['could not read the changed file'] };

  const schema = validateRecord(head);
  if (!schema.ok) errors.push(...schema.errors);

  if (!validateName(nameFromPath).ok) errors.push('filename fails the name grammar');
  if (head.name !== nameFromPath) errors.push('filename must match the record name');

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
    // New names go through /api/claim, which enforces account-age and public-repo
    // eligibility. This branch has no such check, so a day-old account could
    // otherwise claim a name here with a green CI check a maintainer would trust.
    errors.push('new names are claimed at runs-on.dev, not by pull request');
  }

  return { ok: errors.length === 0, errors };
}
