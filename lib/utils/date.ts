export function todayKey(): string {
  return new Date().toISOString().split('T')[0]
}

export function daysBetween(a: number, b: number): number {
  return Math.floor(Math.abs(a - b) / (1000 * 60 * 60 * 24))
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function addDays(ts: number, days: number): number {
  return ts + days * 24 * 60 * 60 * 1000
}

export function formatRelative(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function calculateStreak(dailyDates: string[]): number {
  if (dailyDates.length === 0) return 0

  const sorted = [...new Set(dailyDates)].sort().reverse()
  const today = todayKey()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = (prev.getTime() - curr.getTime()) / 86400000
    if (diff === 1) streak++
    else break
  }
  return streak
}

export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000)
    return d.toISOString().split('T')[0]
  }).reverse()
}
