'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { Plus, Zap, Flame, BookOpen, Trophy, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressRing } from '@/components/home/ProgressRing'
import { WeeklyBar } from '@/components/home/WeeklyBar'
import { useDueWords, useWordCount } from '@/hooks/useWords'
import { useStats, useStreak } from '@/hooks/useStats'
import { RecentWords } from '@/components/home/RecentWords'

// Animated number counter
function AnimatedCount({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(0, { stiffness: 90, damping: 18, mass: 0.8 })
  const display = useTransform(spring, (v) => Math.round(v))
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => { spring.set(value) }, [value, spring])
  useEffect(() => {
    const unsub = display.on('change', setDisplayed)
    return unsub
  }, [display])

  return <span className={className}>{displayed}</span>
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.32, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] }
  }),
}

export default function HomePage() {
  const dueWords = useDueWords()
  const wordCount = useWordCount()
  const stats = useStats()
  const streak = useStreak()
  const [streakPop, setStreakPop] = useState(false)

  const dueCount = dueWords?.length ?? 0
  const todayStats = stats?.weeklyActivity?.[6] ?? { count: 0 }
  const todayTarget = 10
  const reviewedToday = todayStats.count

  const handleStreakTap = () => {
    setStreakPop(true)
    setTimeout(() => setStreakPop(false), 600)
  }

  return (
    <div className="flex flex-col gap-0 min-h-full px-4 pt-6 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-5"
      >
        <div>
          <h1 className="text-2xl font-black text-gradient leading-none pb-0.5">Wordseed</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Keep growing your vocabulary</p>
        </div>
        <motion.div whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
          <Link
            href="/add"
            className="w-11 h-11 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center text-[#0f0f14] glow-primary transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </Link>
        </motion.div>
      </motion.div>

      {/* Hero — due today */}
      <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp} className="mb-3">
        <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden relative"
          style={{ background: 'linear-gradient(145deg, #13131a 0%, #111113 60%, #0e0e1a 100%)' }}>
          {/* Ambient glow blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-15"
            style={{ background: 'radial-gradient(circle, #e879f9 0%, transparent 70%)', transform: 'translate(-20%, 30%)' }} />

          <div className="relative p-5 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)]">Due Today</p>
                <div className="flex items-baseline gap-2">
                  <AnimatedCount
                    value={dueCount}
                    className="text-[56px] font-black leading-none text-[var(--color-text)]"
                  />
                  <span className="text-[var(--color-text-muted)] text-sm font-medium">
                    {dueCount === 1 ? 'word' : 'words'}
                  </span>
                </div>
                {dueCount > 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
                    Your longest streak starts now
                  </p>
                ) : (
                  <p className="text-xs text-[var(--color-success)] flex items-center gap-1">
                    ✓ You&apos;re all caught up!
                  </p>
                )}
              </div>
              <ProgressRing
                value={reviewedToday}
                max={Math.max(todayTarget, reviewedToday)}
                size={88}
                strokeWidth={7}
                label={`${reviewedToday}`}
                sublabel="today"
              />
            </div>
            <div className="mt-4">
              {dueCount > 0 ? (
                <Link href="/quiz?mode=due">
                  <Button size="lg" fullWidth className="glow-primary">
                    <Zap className="w-4 h-4" />
                    Start Review
                  </Button>
                </Link>
              ) : (
                <Link href="/quiz">
                  <Button variant="secondary" size="lg" fullWidth>
                    Practice Anyway
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp} className="grid grid-cols-3 gap-2 mb-3">
        {/* Streak */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={handleStreakTap}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center gap-1 py-4 cursor-pointer hover:border-orange-500/30 transition-colors group"
        >
          <div className="flex items-center gap-1">
            <motion.div
              animate={streakPop ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] } : {}}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <Flame className="w-4 h-4 text-orange-400 group-hover:text-orange-300 transition-colors" />
            </motion.div>
            <AnimatedCount value={streak ?? 0} className="text-xl font-black text-[var(--color-text)]" />
          </div>
          <span className="text-[10px] font-medium text-[var(--color-text-faint)] uppercase tracking-wide">Day Streak</span>
        </motion.button>

        {/* Words */}
        <Card className="flex flex-col items-center gap-1 py-4">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />
            <AnimatedCount value={wordCount?.active ?? 0} className="text-xl font-black text-[var(--color-text)]" />
          </div>
          <span className="text-[10px] font-medium text-[var(--color-text-faint)] uppercase tracking-wide">Words</span>
        </Card>

        {/* Accuracy */}
        <Card className="flex flex-col items-center gap-1 py-4">
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <AnimatedCount value={stats?.accuracy ?? 0} className="text-xl font-black text-[var(--color-text)]" />
            <span className="text-xl font-black text-[var(--color-text)]">%</span>
          </div>
          <span className="text-[10px] font-medium text-[var(--color-text-faint)] uppercase tracking-wide">Accuracy</span>
        </Card>
      </motion.div>

      {/* Weekly activity */}
      {stats?.weeklyActivity && (
        <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp} className="mb-3">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[var(--color-text)]">This Week</p>
              <p className="text-xs text-[var(--color-text-faint)]">
                {stats.weeklyActivity.reduce((a, d) => a + d.count, 0)} reviews
              </p>
            </div>
            <WeeklyBar data={stats.weeklyActivity} />
          </Card>
        </motion.div>
      )}

      {/* Recent words */}
      {(wordCount?.active ?? 0) > 0 && (
        <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp} className="mb-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-sm font-semibold text-[var(--color-text)]">Recent Words</p>
            <Link href="/words" className="text-xs text-[var(--color-primary)] flex items-center gap-0.5 hover:underline">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <RecentWords />
        </motion.div>
      )}

      {/* Empty state */}
      {(wordCount?.active ?? 0) === 0 && (
        <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}>
          <div className="flex flex-col items-center text-center gap-4 py-10 px-6 rounded-2xl border border-dashed border-[var(--color-border)]">
            <motion.div
              className="text-5xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              🌱
            </motion.div>
            <div>
              <p className="font-bold text-[var(--color-text)] text-lg mb-1">Plant your first word</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Tap + to add a word and start building a vocabulary that lasts.
              </p>
            </div>
            <Link href="/add">
              <Button size="md">
                <Plus className="w-4 h-4" />
                Add Your First Word
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
