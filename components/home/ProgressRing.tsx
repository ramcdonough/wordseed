'use client'

import { useEffect, useRef } from 'react'

interface ProgressRingProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
}

export function ProgressRing({
  value,
  max,
  size = 120,
  strokeWidth = 7,
  label,
  sublabel,
}: ProgressRingProps) {
  const circleRef = useRef<SVGCircleElement>(null)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = max > 0 ? Math.min(value / max, 1) : 0
  const gradientId = `ring-gradient-${size}`

  useEffect(() => {
    if (!circleRef.current) return
    const offset = circumference - progress * circumference
    circleRef.current.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)'
    circleRef.current.style.strokeDashoffset = String(offset)
  }, [progress, circumference])

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          ref={circleRef}
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label && <span className="text-2xl font-bold text-[var(--color-text)]">{label}</span>}
          {sublabel && <span className="text-[10px] text-[var(--color-text-muted)]">{sublabel}</span>}
        </div>
      )}
    </div>
  )
}
