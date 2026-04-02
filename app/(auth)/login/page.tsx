'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginWithPassword } from './actions'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/Logo'
import { NavThemeToggle } from '@/components/ui/NavThemeToggle'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'recovery' ? 'recovery' : 'signin'

  // Shared
  const [email, setEmail] = useState('')

  // Sign-in state
  const [password, setPassword] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  // Recovery state
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setSignInLoading(true)
    try {
      const result = await loginWithPassword(email, password)
      if (result?.error) {
        toast.error('Sign in failed', { description: result.error })
        setSignInLoading(false)
        return
      }
      // Full page navigation — ensures proxy sees the fresh session cookies
      window.location.href = '/dashboard'
    } catch {
      toast.error('Sign in failed', { description: 'An unexpected error occurred' })
      setSignInLoading(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setSignInLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setSignInLoading(false)
    if (error) {
      toast.error('Failed to send magic link', { description: error.message })
    } else {
      setMagicSent(true)
    }
  }

  async function handleRecovery(e: React.FormEvent) {
    e.preventDefault()
    setRecoveryLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/auth/reset-password`,
    })
    setRecoveryLoading(false)
    if (error) {
      toast.error('Failed to send reset email', { description: error.message })
    } else {
      setRecoverySent(true)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── LEFT: Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-4 right-4 z-10">
          <NavThemeToggle />
        </div>

        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Logo size={48} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome to SankalpHub</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Quality inspection &amp; workflow management platform.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="recovery">Password Recovery</TabsTrigger>
            </TabsList>

            {/* ── Sign In Tab ── */}
            <TabsContent value="signin" className="mt-6">
              {magicSent ? (
                <div className="text-center space-y-2 p-6 rounded-xl border border-border bg-card">
                  <p className="font-semibold">Check your email</p>
                  <p className="text-sm text-muted-foreground">
                    We sent a magic link to{' '}
                    <span className="font-medium text-foreground">{email}</span>.
                    Click it to sign in.
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setMagicSent(false)} className="mt-2">
                    Use a different email
                  </Button>
                </div>
              ) : useMagicLink ? (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="magic-email">Email address</Label>
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={signInLoading}>
                    {signInLoading ? 'Sending...' : 'Send magic link'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setUseMagicLink(false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to password sign in
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email">Email address</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={signInLoading}>
                    {signInLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setUseMagicLink(true)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign in with magic link instead →
                  </button>
                </form>
              )}
            </TabsContent>

            {/* ── Password Recovery Tab ── */}
            <TabsContent value="recovery" className="mt-6">
              {recoverySent ? (
                <div className="text-center space-y-2 p-6 rounded-xl border border-border bg-card">
                  <p className="font-semibold">Check your email</p>
                  <p className="text-sm text-muted-foreground">
                    We sent a password reset link to{' '}
                    <span className="font-medium text-foreground">{email}</span>.
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setRecoverySent(false)} className="mt-2">
                    Try a different email
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRecovery} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we&apos;ll send a reset link.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="recovery-email">Email address</Label>
                    <Input
                      id="recovery-email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={recoveryLoading}>
                    {recoveryLoading ? 'Sending...' : 'Send reset link'}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── RIGHT: Branding Panel (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #0D1420 0%, #060810 100%)' }}
      >
        <div>
          <Link href="/">
            <Logo size={36} variant="full" className="[&>span]:text-[#EDE0C8]" />
          </Link>
          <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#EDE0C8' }}>
            Production Intelligence Platform
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#888068' }}>
            A unified operating platform designed to enhance manufacturing performance
            through real-time data and AI-driven transparency.
          </p>
        </div>

        <div className="space-y-4">
          {[
            'AQL template builder with AI generation',
            'Real-time factory inspection tracking',
            'Automated PDF reports & compliance',
            'Role-based multi-tenant architecture',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C9A96E' }} />
              <span className="text-sm" style={{ color: '#A09080' }}>{item}</span>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: '#4A4030' }}>
          © {new Date().getFullYear()} SankalpHub. All rights reserved.
        </p>

        {/* Decorative gold glow */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)' }}
        />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
