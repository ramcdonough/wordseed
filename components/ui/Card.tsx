import { cn } from '@/lib/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export function Card({ children, className, onClick, interactive, padding = 'md' }: CardProps) {
  const base = cn(
    'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-paper paper-texture',
    interactive && 'cursor-pointer hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-2)] active:scale-[0.99] transition-all duration-150',
    padding === 'sm' && 'p-3',
    padding === 'md' && 'p-4',
    padding === 'lg' && 'p-6',
    padding === 'none' && '',
    className
  )

  if (onClick || interactive) {
    return (
      <button className={cn(base, 'w-full text-left')} onClick={onClick}>
        {children}
      </button>
    )
  }

  return <div className={base}>{children}</div>
}
