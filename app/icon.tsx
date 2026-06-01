import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

/**
 * Worduous app icon — generated at build time by next/og (satori).
 * A custom geometric "W" mark on a deep dark background.
 *
 * The W is drawn as two overlapping "V" trapezoids meeting at a centre peak,
 * filled with a left→right indigo→violet gradient, sitting on a near-black
 * square with subtle inner-glow corners. No external font required.
 */
export default function Icon() {
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
          // Background: very dark with a subtle deep-indigo tint
          background: 'linear-gradient(150deg, #0c0c14 0%, #130d22 60%, #0c0c14 100%)',
          borderRadius: 112, // ~22% of 512 — rounded square feel
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient inner glow — top-right */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(129,140,248,0.22) 0%, transparent 70%)',
          }}
        />
        {/* Ambient inner glow — bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,121,249,0.14) 0%, transparent 70%)',
          }}
        />

        {/* ── The W mark ── */}
        <svg
          width="310"
          height="240"
          viewBox="0 0 310 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative' }}
        >
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="310" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#818cf8" />
              <stop offset="48%"  stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#e879f9" />
            </linearGradient>
            {/* Subtle inner shadow for depth */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/*
            The W polygon — traced clockwise from top-left outer corner:

            Outer boundary:
              (0,0) TL → (310,0) TR
              → descend right outer stroke → (262,240) right valley outer
              → rise toward centre → (200,80) centre peak outer right
              → descend to left valley → (110,240) left valley outer
              → (48,0) inner top-left edge — LEFT STROKE DONE

            Inner boundary (counterclockwise to cut the interior):
              (48,0) → (90,0) inner left stroke top
              → (148,214) left valley inner
              → (155,196) innermost centre
              → (162,214) right valley inner
              → (220,0) inner right stroke top
              → (262,0) right valley inner top
              → (200,56) centre peak inner (slightly lower = gives the W taper)
              → (110,240) — wait, we already traced this...

            Actually let me use a simpler single polygon for the filled W:
          */}
          <polygon
            points="
              0,0
              52,0
              155,196
              258,0
              310,0
              248,240
              196,240
              155,88
              114,240
              62,240
            "
            fill="url(#wg)"
            filter="url(#glow)"
          />
        </svg>

        {/* ── Accent pill below the W ── */}
        <div
          style={{
            width: 64,
            height: 6,
            borderRadius: 3,
            background: 'linear-gradient(90deg, #818cf8, #e879f9)',
            marginTop: 20,
            opacity: 0.85,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
