/**
 * The shared banner artwork, rendered by both image routes.
 *
 * `app/opengraph-image.js` serves the light card as the social preview, matching the site's
 * own identity. `app/banner-dark/route.js` serves the dark variant, which the README uses as
 * its default because most people read GitHub on a dark theme and a bright card glares there.
 *
 * Both come from this one function so the two can never drift apart.
 */

export const BANNER_SIZE = { width: 1200, height: 630 };

const THEMES = {
  light: {
    ground: '#F4F5F3',
    muted: '#5E6668',
    ink: '#14181B',
    signal: '#1B4DFF',
  },
  dark: {
    ground: '#18140F',
    muted: '#A89C89',
    ink: '#EFE7D9',
    signal: '#8399FF',
  },
};

export function BannerCard({ theme = 'light' }) {
  const t = THEMES[theme] ?? THEMES.light;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '100px',
        background: t.ground,
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 22,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: t.muted,
        }}
      >
        A FREE SUBDOMAIN REGISTRY
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 28 }}>
        <span style={{ fontSize: 84, color: t.muted }}>[</span>
        <span
          style={{
            fontSize: 84,
            fontWeight: 600,
            color: t.ink,
            borderBottom: `4px solid ${t.signal}`,
            padding: '0 12px',
          }}
        >
          yourname
        </span>
        <span style={{ fontSize: 84, color: t.muted }}>]</span>
        <span style={{ fontSize: 84, color: t.muted }}>.runs-on.dev</span>
      </div>
    </div>
  );
}
