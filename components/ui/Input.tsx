'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text-muted)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-[var(--color-surface-2)] border rounded-xl px-4 py-3 text-[var(--color-text)]',
              'placeholder:text-[var(--color-text-faint)]',
              'focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30',
              'transition-colors duration-150',
              error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]',
              icon && 'pl-10',
              iconRight && 'pr-10',
              className
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]">
              {iconRight}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--color-text-faint)]">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
