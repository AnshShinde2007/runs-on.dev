import { validateName } from './name.js';
import { isReserved } from './blocklist.js';
import { checkEligibility } from './eligibility.js';

export const MAX_NAMES_PER_ACCOUNT = 1;

export function evaluateClaim({ name, session, existing, now = new Date(), ownedCount = 0 }) {
  if (!session || !session.login) {
    return { ok: false, status: 401, code: 'signin_required' };
  }

  if (!validateName(name).ok) {
    return { ok: false, status: 400, code: 'invalid_name' };
  }

  if (isReserved(name).reserved) {
    return { ok: false, status: 403, code: 'reserved' };
  }

  const eligible = checkEligibility(
    { created_at: session.createdAt, public_repos: session.publicRepos },
    now,
  );
  if (!eligible.ok) {
    return { ok: false, status: 403, code: `ineligible_${eligible.reason}` };
  }

  if (ownedCount >= MAX_NAMES_PER_ACCOUNT) {
    return { ok: false, status: 403, code: 'limit_reached' };
  }

  if (existing) {
    return { ok: false, status: 409, code: 'taken' };
  }

  return {
    ok: true,
    record: {
      name,
      owner: { github: session.login },
      claimedAt: now.toISOString(),
      records: {},
    },
  };
}
