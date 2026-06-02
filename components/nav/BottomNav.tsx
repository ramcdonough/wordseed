'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Target, User, Compass } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/words', label: 'Words', Icon: BookOpen },
  { href: '/discover', label: 'Discover', Icon: Compass },
  { href: '/train', label: 'Train', Icon: Target },
  { href: '/stats', label: 'Profile', Icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-[var(--color-border)]"
      style={{ paddingBottom: 'var(--safe-area-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 h-16">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

          return (
            <Link key={href} href={href} className="flex-1 flex justify-center">
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[52px] relative',
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-faint)]'
                )}
              >
                {/* Active glow blob */}
                {isActive && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.div
                  animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="relative z-10"
                >
                  <Icon
                    className="w-[22px] h-[22px]"
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  {/* Active dot */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-dot"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-primary)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.div>

                <span className={cn(
                  'text-[10px] font-medium relative z-10 transition-colors',
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-faint)]'
                )}>
                  {label}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
