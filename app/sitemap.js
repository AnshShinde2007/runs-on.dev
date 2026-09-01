// Static pages only. Claimed subdomains live on their own hosts (or the
// built-in profile card at their own origin) and are not part of this
// site's route tree, so they don't belong in its sitemap.
export default function sitemap() {
  const now = new Date();
  const routes = [
    '', '/about', '/faq', '/policy',
    '/docs', '/docs/quickstart', '/docs/records', '/docs/seo', '/docs/resources',
    '/docs/guides',
    '/docs/guides/url-redirect',
    '/docs/guides/vercel',
    '/docs/guides/netlify',
    '/docs/guides/github-pages',
    '/docs/guides/cloudflare-pages',
    '/docs/guides/render',
    '/docs/guides/railway',
    '/docs/guides/firebase',
    '/docs/guides/replit',
    '/docs/guides/codeberg-pages',
    '/docs/guides/email-forwarding',
    '/docs/guides/bluesky-handle',
    '/docs/guides/discord-verification',
  ];

  return routes.map((route) => ({
    url: `https://runs-on.dev${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.6,
  }));
}
