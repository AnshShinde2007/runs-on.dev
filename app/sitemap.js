// Static pages only. Claimed subdomains live on their own hosts (or the
// built-in profile card at their own origin) and are not part of this
// site's route tree, so they don't belong in its sitemap.
export default function sitemap() {
  const now = new Date();
  const routes = ['', '/docs', '/about', '/faq', '/policy'];

  return routes.map((route) => ({
    url: `https://runs-on.dev${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.6,
  }));
}
