import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'new' | 'familiar' | 'learning' | 'strong' | 'mastered'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-1',
        variant === 'default' && 'bg-[var(--color-surface-3)] text-[var(--color-text-muted)]',
        variant === 'primary' && 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]',
        variant === 'success' && 'bg-[var(--color-success-subtle)] text-[var(--color-success)]',
        variant === 'warning' && 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]',
        variant === 'error' && 'bg-[var(--color-error-subtle)] text-[var(--color-error)]',
        variant === 'new' && 'bg-zinc-800/60 text-zinc-400',
        variant === 'familiar' && 'bg-blue-950/60 text-blue-400',
        variant === 'learning' && 'bg-amber-950/60 text-amber-400',
        variant === 'strong' && 'bg-emerald-950/60 text-emerald-400',
        variant === 'mastered' && 'bg-violet-950/60 text-violet-400',
        className
      )}
    >
      {children}
    </span>
  )
}
