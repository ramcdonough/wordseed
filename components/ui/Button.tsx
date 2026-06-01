'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none',
          'active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
          // Variants
          variant === 'primary' && 'bg-[var(--color-primary)] text-[#0f0f14] hover:bg-indigo-400 rounded-xl',
          variant === 'secondary' && 'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-xl',
          variant === 'ghost' && 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-xl',
          variant === 'danger' && 'bg-[var(--color-error-subtle)] text-[var(--color-error)] hover:bg-red-950 border border-red-900/30 rounded-xl',
          variant === 'success' && 'bg-[var(--color-success-subtle)] text-[var(--color-success)] hover:bg-emerald-950 border border-emerald-900/30 rounded-xl',
          // Sizes
          size === 'sm' && 'text-xs px-3 py-1.5 h-7',
          size === 'md' && 'text-sm px-4 py-2 h-9',
          size === 'lg' && 'text-base px-5 py-2.5 h-11',
          size === 'xl' && 'text-base px-6 py-3.5 h-14 rounded-2xl',
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </span>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
