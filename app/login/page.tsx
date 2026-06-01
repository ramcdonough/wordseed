'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { signInWithPopup, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { useUser, useAuthLoading } from '@/hooks/useAuth'
import { useAuthBoot } from '@/hooks/useAuth'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

// Google icon SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  useAuthBoot()
  const user = useUser()
  const loading = useAuthLoading()
  const router = useRouter()
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already signed in
  useEffect(() => {
    if (!loading && user) router.replace('/')
  }, [loading, user, router])

  // Handle redirect result (mobile fallback)
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) router.replace('/')
    }).catch(() => {})
  }, [router])

  const signInWithGoogle = async () => {
    setSigning(true)
    setError('')
    const provider = new GoogleAuthProvider()

    try {
      // Popup works on desktop; fall back to redirect on mobile
      await signInWithPopup(auth, provider)
      router.replace('/')
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string }
      if (firebaseErr?.code === 'auth/popup-blocked' || firebaseErr?.code === 'auth/popup-closed-by-user') {
        // Mobile browsers block popups — use redirect instead
        await signInWithRedirect(auth, provider)
      } else {
        setError('Sign-in failed. Please try again.')
        setSigning(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #09090b 0%, #0e0e1a 50%, #09090b 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm flex flex-col gap-10">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl"
          >
            🌱
          </motion.div>
          <h1 className="text-4xl font-black text-gradient">Wordseed</h1>
          <p className="text-[var(--color-text-muted)] text-base leading-relaxed max-w-xs">
            Build a vocabulary that actually sticks.
          </p>
        </motion.div>

        {/* Sign-in */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          <Button
            onClick={signInWithGoogle}
            loading={signing}
            size="xl"
            fullWidth
            variant="secondary"
            className="!border-[var(--color-border)] hover:!border-[var(--color-primary)]/40"
          >
            {!signing && <GoogleIcon />}
            Continue with Google
          </Button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-[var(--color-error)] text-center"
            >
              {error}
            </motion.p>
          )}

          <div className="flex items-center justify-center gap-3 text-[11px] text-[var(--color-text-faint)]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Syncs between all devices
            </span>
            <span>·</span>
            <span>Works offline</span>
            <span>·</span>
            <span>Free forever</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
