import { NextResponse } from 'next/server';

const ROOT = 'runs-on.dev';

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
};

export function proxy(request) {
  const host = (request.headers.get('host') ?? '').split(':')[0];

  // /sites/* is a real, publicly routable path, so refuse it from the outside on
  // every host. An internal rewrite does not re-enter proxy, so cards still render.
  if (request.nextUrl.pathname.startsWith('/sites/')) {
    return new NextResponse('not found', { status: 404 });
  }

  if (host === ROOT || host === `www.${ROOT}` || host.endsWith('.vercel.app') || host === 'localhost') {
    return NextResponse.next();
  }

  if (!host.endsWith(`.${ROOT}`)) return NextResponse.next();

  const name = host.slice(0, -1 * (ROOT.length + 1));
  if (name.includes('.')) return NextResponse.next();

  return NextResponse.rewrite(new URL(`/sites/${name}${request.nextUrl.pathname}`, request.url));
}
