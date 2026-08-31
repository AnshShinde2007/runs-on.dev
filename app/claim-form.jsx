'use client';

import { useEffect, useRef, useState } from 'react';

const CHECK_DEBOUNCE_MS = 300;
const MAX_CLAIM_RETRIES = 5;
const RETRY_BASE_MS = 1000;
const RETRY_CEILING_MS = 8000;

export default function ClaimForm({ signedIn }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState(null);
  const nameRef = useRef('');
  const debounceRef = useRef(null);
  const lastCheckedRef = useRef('');
  const lastResultRef = useRef({ value: '', status: null });

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function onChange(value) {
    nameRef.current = value;
    setName(value);
    clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setStatus(null);
      return;
    }

    debounceRef.current = setTimeout(() => check(value), CHECK_DEBOUNCE_MS);
  }

  async function check(value) {
    if (value === lastCheckedRef.current) {
      // Already have a result for this exact name (e.g. typed, edited, then
      // retyped back) — reuse it instead of spending another API call.
      if (nameRef.current === value) setStatus(lastResultRef.current.status);
      return;
    }
    lastCheckedRef.current = value;

    const res = await fetch(`/api/check?name=${encodeURIComponent(value)}`);
    const body = res.ok ? await res.json().catch(() => null) : null;
    const result = body && body.available ? 'available' : (body && body.code) || 'check_failed';
    lastResultRef.current = { value, status: result };

    // The input may have changed (or been retyped) while this was in flight —
    // discard a response that no longer matches what's on screen.
    if (nameRef.current !== value) return;
    setStatus(result);
  }

  async function claim(attempt = 0) {
    setStatus('claiming');
    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (res.status === 503) {
      if (attempt >= MAX_CLAIM_RETRIES) {
        setStatus('retry_exhausted');
        return;
      }
      // Exponential backoff with jitter, capped, so a rate-limit storm doesn't
      // turn every waiting claimant into another request against an
      // already-exhausted quota.
      const backoff = Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_CEILING_MS);
      const delay = backoff / 2 + Math.random() * (backoff / 2);
      setStatus('retrying');
      setTimeout(() => claim(attempt + 1), delay);
      return;
    }

    const body = await res.json();
    setStatus(res.ok ? 'claimed' : body.error);
  }

  return (
    <div className="space-y-3">
      <label htmlFor="claim-name" className="block text-sm text-(--color-muted)">
        Subdomain
      </label>
      <div className="flex items-center border border-(--color-edge) bg-(--color-panel)">
        <input
          id="claim-name"
          value={name}
          onChange={(e) => onChange(e.target.value.trim().toLowerCase())}
          placeholder="e.g. lucas"
          className="flex-1 bg-transparent px-4 py-3 outline-none"
        />
        <span className="px-4 text-(--color-muted)">.runs-on.dev</span>
      </div>

      {status && <p className="text-sm text-(--color-accent)">{message(status, name)}</p>}

      {signedIn ? (
        <button
          onClick={() => claim()}
          disabled={status !== 'available'}
          aria-disabled={status !== 'available'}
          className="border border-(--color-accent) px-4 py-2 text-(--color-accent) disabled:opacity-40"
        >
          Claim it
        </button>
      ) : (
        <a href="/api/auth/github" className="inline-block border border-(--color-accent) px-4 py-2 text-(--color-accent)">
          Sign in with GitHub to claim
        </a>
      )}
    </div>
  );
}

function message(status, name) {
  const map = {
    available: `${name}.runs-on.dev is available.`,
    taken: 'Already claimed.',
    reserved: 'That name is reserved.',
    invalid_length: 'Names are 2 to 32 characters.',
    invalid_charset: 'Lowercase letters, numbers and hyphens only.',
    invalid_hyphen: 'Names cannot start or end with a hyphen.',
    invalid_punycode: 'That pattern is not allowed.',
    invalid_name: 'That name is not valid.',
    server_error: 'Something broke on our side. Try again.',
    claiming: 'Claiming…',
    retrying: 'Busy right now — holding your claim and retrying.',
    retry_exhausted: 'Still overloaded. Try again in a few minutes.',
    busy: 'Too busy to check right now. Try again in a moment.',
    check_failed: 'Could not check that name. Try again.',
    claimed: `Done. ${name}.runs-on.dev is yours.`,
    signin_required: 'Sign in with GitHub first.',
    ineligible_age: 'Your GitHub account must be at least 30 days old.',
    ineligible_repos: 'Your GitHub account needs at least one public repository.',
    limit_reached: 'You already have a name. One per account for now.',
  };
  return map[status] ?? 'Something went wrong.';
}
