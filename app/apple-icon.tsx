import { ImageResponse } from 'next/og'

// Apple touch icon — same mark, 180×180 for iPhone home screen
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 0,
          background: 'linear-gradient(150deg, #0c0c14 0%, #130d22 60%, #0c0c14 100%)',
          // iOS adds its own corner radius — no borderRadius needed here
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: -28,
            right: -28,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(129,140,248,0.22) 0%, transparent 70%)',
          }}
        />

        {/* W mark — scaled to fit 180×180 */}
        <svg width="110" height="86" viewBox="0 0 310 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wg2" x1="0" y1="0" x2="310" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#818cf8" />
              <stop offset="48%"  stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#e879f9" />
            </linearGradient>
          </defs>
          <polygon
            points="0,0 52,0 155,196 258,0 310,0 248,240 196,240 155,88 114,240 62,240"
            fill="url(#wg2)"
          />
        </svg>

        {/* Accent pill */}
        <div
          style={{
            width: 22,
            height: 3,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #818cf8, #e879f9)',
            marginTop: 7,
            opacity: 0.85,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
