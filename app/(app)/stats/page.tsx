'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import {
  Flame, Target, BookOpen, ChevronRight, Check,
  LogOut, Palette, BarChart2, Trophy, Sun,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase/client'
import { useUser } from '@/hooks/useAuth'
import { useStats } from '@/hooks/useStats'
import { useThemeStore } from '@/stores/theme'
import { THEMES } from '@/lib/themes'
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
    transition: { delay: i * 0.07, duration: 0.32, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] },
  }),
}

function getInitials(email: string | null | undefined, name: string | null | undefined): string {
  if (name) return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  if (email) return email[0].toUpperCase()
  return '?'
}

function formatMemberSince(createdAt: string | undefined): string {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function ProfilePage() {
  const user = useUser()
  const stats = useStats()
  const router = useRouter()
  const { themeId, setTheme } = useThemeStore()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut(auth)
    router.replace('/login')
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const {
    totalWords, activeWords, archivedWords, accuracy, streak,
    weeklyActivity, hardestWords, masteredWords, sessionsCompleted, dailyStats,
  } = stats
  const totalReviews = dailyStats.reduce((a, s) => a + s.wordsReviewed, 0)
  const initials = getInitials(user?.email, user?.displayName)
  const memberSince = formatMemberSince(user?.metadata?.creationTime)

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Profile hero ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden px-4 pt-8 pb-6"
      >
        {/* Ambient gradient */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--color-primary) 30%, transparent), transparent)',
          }}
        />

        <div className="relative flex flex-col items-center gap-3 text-center">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
            className="relative"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black shadow-paper"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, var(--color-success)))',
                color: 'var(--color-primary-foreground)',
              }}
            >
              {initials}
            </div>
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-full opacity-30 blur-md"
              style={{ background: 'var(--color-primary)' }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <p className="text-xl font-black text-[var(--color-text)]">
              {user?.displayName || user?.email?.split('@')[0] || 'Learner'}
            </p>
            <p className="text-sm text-[var(--color-text-faint)] mt-0.5">{user?.email}</p>
            {memberSince && (
              <p className="text-xs text-[var(--color-text-faint)] mt-0.5">Member since {memberSince}</p>
            )}
          </motion.div>

          {/* Quick hero stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="flex gap-6 mt-1"
          >
            {[
              { value: totalWords, label: 'Words' },
              { value: streak, label: 'Streak', suffix: '' },
              { value: accuracy, label: 'Accuracy', suffix: '%' },
            ].map(({ value, label, suffix }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-black text-[var(--color-text)]">
                  <AnimatedCount value={value} suffix={suffix ?? ''} />
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-faint)]">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-4 px-4 pb-8">

        {/* ── Appearance ── */}
        <motion.section custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <SectionHeader icon={<Palette className="w-3.5 h-3.5" />} label="Appearance" />
          <div className="grid grid-cols-5 gap-2 mt-2">
            {THEMES.map((theme) => {
              const isActive = themeId === theme.id
              return (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-2xl border-2 transition-all duration-200 overflow-hidden flex items-center justify-center"
                      style={{
                        background: theme.swatchBg,
                        borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                        boxShadow: isActive
                          ? '0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent)'
                          : undefined,
                      }}
                    >
                      {/* Primary dot */}
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ background: theme.swatchPrimary }}
                      />
                      {/* Accent dot if theme has one */}
                      {theme.swatchAccent && (
                        <div
                          className="w-2 h-2 rounded-full absolute bottom-2 right-2"
                          style={{ background: theme.swatchAccent }}
                        />
                      )}
                    </div>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--color-primary)' }}
                        >
                          <Check className="w-3 h-3" style={{ color: 'var(--color-primary-foreground)' }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span
                    className="text-[9px] font-semibold leading-tight text-center transition-colors"
                    style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-faint)' }}
                  >
                    {theme.name}
                  </span>
                </button>
              )
            })}
          </div>
        </motion.section>

        {/* ── Statistics header ── */}
        <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
          <SectionHeader icon={<BarChart2 className="w-3.5 h-3.5" />} label="Statistics" />
        </motion.div>

        {/* Hero stat cards */}
        <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp} className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-orange-500/20 overflow-hidden relative"
            style={{ background: 'linear-gradient(145deg, color-mix(in srgb, #f97316 8%, var(--color-surface)) 0%, var(--color-surface) 80%)' }}>
            <div className="absolute inset-0 opacity-15"
              style={{ background: 'radial-gradient(circle at 80% 20%, #f97316, transparent 70%)' }} />
            <div className="relative p-4 flex flex-col gap-1.5">
              <Flame className="w-5 h-5 text-orange-400" />
              <p className="text-3xl font-black text-[var(--color-text)]"><AnimatedCount value={streak} /></p>
              <p className="text-sm font-semibold text-[var(--color-text)]">Day Streak</p>
              <p className="text-xs text-orange-400/70">{streak > 0 ? 'Keep it up! 🔥' : 'Start today'}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-primary)]/20 overflow-hidden relative"
            style={{ background: 'linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)) 0%, var(--color-surface) 80%)' }}>
            <div className="absolute inset-0 opacity-15"
              style={{ background: 'radial-gradient(circle at 80% 20%, var(--color-primary), transparent 70%)' }} />
            <div className="relative p-4 flex flex-col gap-1.5">
              <Target className="w-5 h-5 text-[var(--color-primary)]" />
              <p className="text-3xl font-black text-[var(--color-text)]"><AnimatedCount value={accuracy} suffix="%" /></p>
              <p className="text-sm font-semibold text-[var(--color-text)]">Accuracy</p>
              <p className="text-xs text-[var(--color-text-faint)]"><AnimatedCount value={totalReviews} /> reviews</p>
            </div>
          </div>
        </motion.div>

        {/* Word counts */}
        <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}>
          <Card>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)] mb-3">Your Vocabulary</p>
            <div className="flex gap-4">
              {[
                { value: totalWords, label: 'Total' },
                { value: activeWords, label: 'Active' },
                { value: archivedWords, label: 'Archived' },
                { value: sessionsCompleted, label: 'Quizzes' },
              ].map(({ value, label }, i) => (
                <div key={label} className="flex flex-col items-center gap-0.5 flex-1 relative">
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
          <motion.div custom={4} initial="hidden" animate="show" variants={fadeUp}>
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
          <motion.div custom={5} initial="hidden" animate="show" variants={fadeUp}>
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)] mb-3">This Week</p>
              <ActivityHeatmap data={weeklyActivity} />
            </Card>
          </motion.div>
        )}

        {/* Mastery distribution */}
        {activeWords > 0 && (
          <motion.div custom={6} initial="hidden" animate="show" variants={fadeUp}>
            <MasteryDistribution />
          </motion.div>
        )}

        {/* Hardest words */}
        {hardestWords.length > 0 && (
          <motion.div custom={7} initial="hidden" animate="show" variants={fadeUp}>
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
          <motion.div custom={8} initial="hidden" animate="show" variants={fadeUp}>
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
          <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}>
            <Card className="flex flex-col items-center text-center gap-4 py-10">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                <BarChart2 className="w-10 h-10 text-[var(--color-text-faint)]" />
              </motion.div>
              <div>
                <p className="font-semibold text-[var(--color-text)] mb-1">No stats yet</p>
                <p className="text-sm text-[var(--color-text-muted)]">Add words and complete quizzes to see your progress.</p>
              </div>
              <Link href="/add" className="text-sm text-[var(--color-primary)] font-medium hover:underline">
                Add your first word →
              </Link>
            </Card>
          </motion.div>
        )}

        {/* ── Settings ── */}
        <motion.section custom={9} initial="hidden" animate="show" variants={fadeUp} className="mt-2">
          <SectionHeader icon={<Sun className="w-3.5 h-3.5" />} label="Account" />
          <div className="mt-2 flex flex-col gap-1.5">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:border-[var(--color-error)]/30 hover:bg-[var(--color-error-subtle)] transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 transition-colors group-hover:text-[var(--color-error)]" />
                <span className="text-sm font-medium">{signingOut ? 'Signing out…' : 'Sign out'}</span>
              </div>
              {!signingOut && <ChevronRight className="w-4 h-4 opacity-40" />}
            </button>
          </div>
        </motion.section>

        <div className="pb-2 text-center">
          <p className="text-[10px] text-[var(--color-text-faint)]">Wordseed — grow your vocabulary</p>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-[var(--color-text-faint)]">{icon}</span>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)]">{label}</p>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
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
                    ? 'linear-gradient(180deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, var(--color-success)))'
                    : d.count > 0
                    ? `color-mix(in srgb, var(--color-primary) ${Math.round(30 + intensity * 50)}%, transparent)`
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
