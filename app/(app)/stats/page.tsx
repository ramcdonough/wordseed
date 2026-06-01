'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { Flame, Trophy, Target, BookOpen, BarChart2, ChevronRight } from 'lucide-react'
import { useStats } from '@/hooks/useStats'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MasteryDistribution } from '@/components/stats/MasteryDistribution'
import { getMasteryLabel } from '@/lib/srs/sm2'
import type { Word } from '@/types'

const MASTERY_VARIANT: Record<string, 'new' | 'familiar' | 'learning' | 'strong' | 'mastered'> = {
  New: 'new', Familiar: 'familiar', Learning: 'learning', Strong: 'strong', Mastered: 'mastered',
}

function AnimatedCount({ value, suffix = '' }: { value: number; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 80, damping: 18, mass: 0.9 })
  const display = useTransform(spring, (v) => Math.round(v))
  const [shown, setShown] = useState(0)
  useEffect(() => { spring.set(value) }, [value, spring])
  useEffect(() => { const u = display.on('change', setShown); return u }, [display])
  return <>{shown}{suffix}</>
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.32, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] }
  }),
}

export default function StatsPage() {
  const stats = useStats()

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { totalWords, activeWords, archivedWords, accuracy, streak,
    weeklyActivity, hardestWords, masteredWords, sessionsCompleted, dailyStats } = stats
  const totalReviews = dailyStats.reduce((a, s) => a + s.wordsReviewed, 0)

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-8 min-h-full">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-[var(--color-text)]">Statistics</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Your learning journey</p>
      </motion.div>

      {/* Hero stats */}
      <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp} className="grid grid-cols-2 gap-2">
        {/* Streak card */}
        <div className="rounded-2xl border border-orange-500/20 overflow-hidden relative"
          style={{ background: 'linear-gradient(145deg, #1a1208 0%, #111113 80%)' }}>
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(circle at 80% 20%, #f97316, transparent 70%)' }} />
          <div className="relative p-4 flex flex-col gap-1.5">
            <Flame className="w-5 h-5 text-orange-400" />
            <p className="text-3xl font-black text-[var(--color-text)]">
              <AnimatedCount value={streak} />
            </p>
            <p className="text-sm font-semibold text-[var(--color-text)]">Day Streak</p>
            <p className="text-xs text-orange-400/70">{streak > 0 ? 'Keep it up! 🔥' : 'Start today'}</p>
          </div>
        </div>

        {/* Accuracy card */}
        <div className="rounded-2xl border border-[var(--color-primary)]/20 overflow-hidden relative"
          style={{ background: 'linear-gradient(145deg, #0e0e1a 0%, #111113 80%)' }}>
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(circle at 80% 20%, #818cf8, transparent 70%)' }} />
          <div className="relative p-4 flex flex-col gap-1.5">
            <Target className="w-5 h-5 text-[var(--color-primary)]" />
            <p className="text-3xl font-black text-[var(--color-text)]">
              <AnimatedCount value={accuracy} suffix="%" />
            </p>
            <p className="text-sm font-semibold text-[var(--color-text)]">Accuracy</p>
            <p className="text-xs text-[var(--color-text-faint)]"><AnimatedCount value={totalReviews} /> reviews</p>
          </div>
        </div>
      </motion.div>

      {/* Word counts */}
      <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)] mb-3">Your Vocabulary</p>
          <div className="flex gap-4">
            {[
              { value: totalWords, label: 'Total' },
              { value: activeWords, label: 'Active' },
              { value: archivedWords, label: 'Archived' },
              { value: sessionsCompleted, label: 'Quizzes' },
            ].map(({ value, label }, i) => (
              <div key={label} className="flex flex-col items-center gap-0.5 flex-1">
                {i > 0 && <div className="absolute left-0 top-1 bottom-1 w-px bg-[var(--color-border)]" />}
                <span className="text-2xl font-black text-[var(--color-text)]"><AnimatedCount value={value} /></span>
                <span className="text-[10px] text-[var(--color-text-faint)]">{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Accuracy bar */}
      {totalReviews > 0 && (
        <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp}>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)]">Overall Accuracy</p>
              <span className="text-sm font-bold text-[var(--color-text)]">{accuracy}%</span>
            </div>
            <div className="h-3 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${accuracy}%` }}
                transition={{ duration: 1, ease: [0.34, 1.2, 0.64, 1], delay: 0.3 }}
                style={{
                  background: accuracy >= 70
                    ? 'linear-gradient(90deg, #34d399, #10b981)'
                    : accuracy >= 50
                    ? 'linear-gradient(90deg, #fbbf24, #f97316)'
                    : 'linear-gradient(90deg, #f87171, #e879f9)',
                }}
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Weekly heatmap */}
      {weeklyActivity && (
        <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}>
          <Card>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)] mb-3">This Week</p>
            <ActivityHeatmap data={weeklyActivity} />
          </Card>
        </motion.div>
      )}

      {/* Mastery distribution */}
      {activeWords > 0 && (
        <motion.div custom={4} initial="hidden" animate="show" variants={fadeUp}>
          <MasteryDistribution />
        </motion.div>
      )}

      {/* Hardest words */}
      {hardestWords.length > 0 && (
        <motion.div custom={5} initial="hidden" animate="show" variants={fadeUp}>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-sm font-semibold text-[var(--color-text)]">Needs Work</p>
            <span className="text-xs text-[var(--color-text-faint)]">Lowest accuracy</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {hardestWords.map((word, i) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
              >
                <WordRow word={word} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Mastered words */}
      {masteredWords.length > 0 && (
        <motion.div custom={6} initial="hidden" animate="show" variants={fadeUp}>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-sm font-semibold text-[var(--color-text)]">Well Mastered</p>
            <span className="text-xs text-[var(--color-text-faint)]">Highest mastery</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {masteredWords.map((word, i) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
              >
                <WordRow word={word} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {totalWords === 0 && (
        <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
          <Card className="flex flex-col items-center text-center gap-4 py-10">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <BarChart2 className="w-10 h-10 text-[var(--color-text-faint)]" />
            </motion.div>
            <div>
              <p className="font-semibold text-[var(--color-text)] mb-1">No data yet</p>
              <p className="text-sm text-[var(--color-text-muted)]">Add words and complete quizzes to see your stats.</p>
            </div>
            <Link href="/add" className="text-sm text-[var(--color-primary)] font-medium hover:underline">
              Add your first word →
            </Link>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => {
        const intensity = d.count / max
        const isToday = d.date === today
        const dayName = days[new Date(d.date + 'T12:00:00').getDay()]

        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex-1 flex items-end w-full">
              <motion.div
                className="w-full rounded-t-md"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(intensity * 100, d.count > 0 ? 12 : 3)}%` }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: [0.34, 1.2, 0.64, 1] }}
                style={{
                  background: isToday
                    ? 'linear-gradient(180deg, #818cf8, #e879f9)'
                    : d.count > 0
                    ? `rgba(129, 140, 248, ${0.3 + intensity * 0.5})`
                    : 'var(--color-border)',
                  minHeight: 3,
                }}
              />
            </div>
            <span className={`text-[9px] font-semibold ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-faint)]'}`}>
              {dayName.charAt(0)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function WordRow({ word }: { word: Word }) {
  const label = getMasteryLabel(word.masteryScore)
  const accuracy = word.timesSeen > 0 ? Math.round((word.timesCorrect / word.timesSeen) * 100) : null

  return (
    <Link href={`/words/${word.id}`}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-primary)]/30 transition-colors group"
      >
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="font-semibold text-[var(--color-text)] capitalize">{word.word}</span>
          <span className="text-xs text-[var(--color-text-faint)]">
            {accuracy !== null ? `${accuracy}% accuracy · ${word.timesSeen} reviews` : 'Not reviewed yet'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={MASTERY_VARIANT[label] ?? 'new'}>{label}</Badge>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-faint)] shrink-0 group-hover:text-[var(--color-text-muted)] transition-colors" />
        </div>
      </motion.div>
    </Link>
  )
}
