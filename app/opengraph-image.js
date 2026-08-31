import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '100px',
          background: '#F4F5F3',
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#5E6668',
          }}
        >
          A FREE SUBDOMAIN REGISTRY
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 28 }}>
          <span style={{ fontSize: 84, color: '#5E6668' }}>[</span>
          <span
            style={{
              fontSize: 84,
              fontWeight: 600,
              color: '#14181B',
              borderBottom: '4px solid #1B4DFF',
              padding: '0 12px',
            }}
          >
            yourname
          </span>
          <span style={{ fontSize: 84, color: '#5E6668' }}>]</span>
          <span style={{ fontSize: 84, color: '#5E6668' }}>.runs-on.dev</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
