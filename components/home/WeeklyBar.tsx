'use client'

import { motion } from 'framer-motion'

interface DayBar { date: string; count: number }

export function WeeklyBar({ data }: { data: DayBar[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex items-end gap-1.5 h-14">
      {data.map((d, i) => {
        const pct = Math.max((d.count / max) * 100, d.count > 0 ? 10 : 0)
        const isToday = d.date === today
        const hasActivity = d.count > 0

        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex-1 flex items-end w-full">
              <motion.div
                className="w-full rounded-t-lg relative overflow-hidden"
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: [0.34, 1.2, 0.64, 1] }}
                style={{ minHeight: hasActivity ? 4 : 2 }}
              >
                {isToday ? (
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #818cf8, #e879f9)' }} />
                ) : hasActivity ? (
                  <div className="absolute inset-0 bg-[var(--color-surface-3)]" style={{ opacity: 0.6 + (d.count / max) * 0.4 }} />
                ) : (
                  <div className="absolute inset-0 bg-[var(--color-border-subtle)] opacity-40" />
                )}
              </motion.div>
            </div>
            <span className="text-[9px] font-semibold" style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-text-faint)' }}>
              {days[new Date(d.date + 'T12:00:00').getDay()]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
