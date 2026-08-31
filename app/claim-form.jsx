'use client';

import { useState } from 'react';

export default function ClaimForm({ signedIn }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState(null);

  async function check(value) {
    setName(value);
    if (value.length < 2) return setStatus(null);
    const res = await fetch(`/api/check?name=${encodeURIComponent(value)}`);
    const body = await res.json();
    setStatus(body.available ? 'available' : body.code);
  }

  async function claim() {
    setStatus('claiming');
    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (res.status === 503) {
      const { retryInMs } = await res.json();
      setStatus('busy');
      setTimeout(claim, retryInMs);
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
          onChange={(e) => check(e.target.value.trim().toLowerCase())}
          placeholder="e.g. lucas"
          className="flex-1 bg-transparent px-4 py-3 outline-none"
        />
        <span className="px-4 text-(--color-muted)">.runs-on.dev</span>
      </div>

      {status && <p className="text-sm text-(--color-accent)">{message(status, name)}</p>}

      {signedIn ? (
        <button
          onClick={claim}
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
    busy: 'Busy right now — holding your claim and retrying.',
    claimed: `Done. ${name}.runs-on.dev is yours.`,
    signin_required: 'Sign in with GitHub first.',
    ineligible_age: 'Your GitHub account must be at least 30 days old.',
    ineligible_repos: 'Your GitHub account needs at least one public repository.',
  };
  return map[status] ?? 'Something went wrong.';
}
