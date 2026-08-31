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
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0a12',
        }}
      >
        <div
          style={{
            display: 'flex',
            border: '2px solid #2a2440',
            padding: '48px 96px',
            background: '#14121f',
          }}
        >
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 64,
              letterSpacing: 4,
              color: '#7c5cff',
            }}
          >
            .runs-on.dev
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
