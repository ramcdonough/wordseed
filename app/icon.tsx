import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

/**
 * Wordseed app icon — generated at build time by next/og (satori).
 *
 * Concept: the geometric W letterform (words/knowledge) with a seedling
 * sprouting from its centre peak (seed/growth). The W is filled with an
 * indigo→violet→pink gradient; the sprout is emerald green. The two colours
 * are complementary and carry the brand meaning directly in the mark.
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
          // Very dark background with a whisper of deep green warmth
          background: 'linear-gradient(150deg, #0b0c10 0%, #0c1210 55%, #0b0c10 100%)',
          borderRadius: 112,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow — top-right (violet) */}
        <div style={{
          position: 'absolute', top: -90, right: -90,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
        }} />
        {/* Ambient glow — bottom-left (emerald) */}
        <div style={{
          position: 'absolute', bottom: -70, left: -70,
          width: 240, height: 240, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 70%)',
        }} />

        {/*
          The SVG mark — viewBox extended upward (-80) to make room for the sprout.
          W polygon: 5-point letterform, indigo→violet→pink gradient.
          Sprout: stem + two leaf curves in emerald, growing from the W's centre peak.
        */}
        <svg
          width="296"
          height="300"
          viewBox="-10 -80 330 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* W gradient: indigo → violet → pink */}
            <linearGradient id="wg" x1="0" y1="0" x2="310" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#818cf8" />
              <stop offset="45%"  stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#e879f9" />
            </linearGradient>

            {/* Sprout glow filter */}
            <filter id="sprout-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── The W mark ── */}
          <polygon
            points="0,0 52,0 155,196 258,0 310,0 248,240 196,240 155,88 114,240 62,240"
            fill="url(#wg)"
          />

          {/* ── Sprout growing from the W's centre peak ── */}
          <g filter="url(#sprout-glow)">
            {/* Stem — straight up from the W's centre */}
            <line
              x1="155" y1="-4"
              x2="155" y2="-54"
              stroke="#34d399"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* Left leaf — curves gently outward */}
            <path
              d="M 155 -34 Q 118 -70 95 -58"
              stroke="#34d399"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />
            {/* Right leaf — mirrors the left */}
            <path
              d="M 155 -34 Q 192 -70 215 -58"
              stroke="#34d399"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  )
}
