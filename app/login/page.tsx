'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #09090b 0%, #0e0e1a 50%, #09090b 100%)' }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              {/* Logo */}
              <div className="flex flex-col items-center gap-2 text-center">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-5xl mb-1"
                >
                  🌱
                </motion.div>
                <h1 className="text-3xl font-black text-gradient">Wordseed</h1>
                <p className="text-[var(--color-text-muted)] text-sm">
                  Your vocabulary, everywhere.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-faint)]" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl pl-11 pr-4 py-3.5 text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-[var(--color-error)] text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <Button type="submit" size="xl" fullWidth loading={loading} className="glow-primary">
                  Continue with Email
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              <div className="flex flex-col gap-2 text-center">
                <p className="text-xs text-[var(--color-text-faint)]">
                  We&apos;ll send a magic link — no password needed.
                </p>
                <div className="flex items-center justify-center gap-3 text-[10px] text-[var(--color-text-faint)]">
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Syncs across all devices</span>
                  <span>·</span>
                  <span>Works offline</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-5 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <CheckCircle className="w-16 h-16 text-[var(--color-success)]" strokeWidth={1.5} />
              </motion.div>
              <div>
                <h2 className="text-2xl font-black text-[var(--color-text)] mb-2">Check your email</h2>
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                  We sent a magic link to<br />
                  <span className="text-[var(--color-text)] font-medium">{email}</span>
                </p>
              </div>
              <p className="text-xs text-[var(--color-text-faint)]">
                Tap the link in the email to sign in.<br />
                You can close this tab.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-xs text-[var(--color-primary)] hover:underline"
              >
                Use a different email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
