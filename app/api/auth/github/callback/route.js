import { signSession } from '../../../../../lib/session.js';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookie = request.headers.get('cookie') ?? '';
  const expected = cookie.match(/(?:^|;\s*)oauth_state=([^;]+)/)?.[1];
  if (!code || !state || !expected || state !== expected) {
    return new Response('bad oauth state', { status: 400 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const { access_token: accessToken } = await tokenRes.json();
  if (!accessToken) return new Response('oauth exchange failed', { status: 400 });

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
  });
  const user = await userRes.json();

  const session = signSession(
    {
      login: user.login,
      avatar: user.avatar_url,
      name: user.name,
      bio: user.bio,
      createdAt: user.created_at,
      publicRepos: user.public_repos,
    },
    process.env.SESSION_SECRET,
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/?signed-in=1',
      'Set-Cookie': `session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`,
    },
  });
}
