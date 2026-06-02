import { ImageResponse } from 'next/og'

// Apple touch icon — same sprouting-W mark, 180×180 for iPhone home screen.
// iOS applies its own corner radius so we don't add one here.
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
          background: 'linear-gradient(150deg, #0b0c10 0%, #0c1210 55%, #0b0c10 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient violet glow */}
        <div style={{
          position: 'absolute', top: -32, right: -32,
          width: 105, height: 105, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
        }} />
        {/* Ambient emerald glow */}
        <div style={{
          position: 'absolute', bottom: -24, left: -24,
          width: 84, height: 84, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.16) 0%, transparent 70%)',
        }} />

        <svg
          width="104"
          height="106"
          viewBox="-10 -80 330 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="wg2" x1="0" y1="0" x2="310" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#818cf8" />
              <stop offset="45%"  stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#e879f9" />
            </linearGradient>
            <filter id="sg2" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <polygon
            points="0,0 52,0 155,196 258,0 310,0 248,240 196,240 155,88 114,240 62,240"
            fill="url(#wg2)"
          />

          <g filter="url(#sg2)">
            <line x1="155" y1="-4" x2="155" y2="-54"
              stroke="#34d399" strokeWidth="11" strokeLinecap="round" />
            <path d="M 155 -34 Q 118 -70 95 -58"
              stroke="#34d399" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M 155 -34 Q 192 -70 215 -58"
              stroke="#34d399" strokeWidth="10" fill="none" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  )
}
