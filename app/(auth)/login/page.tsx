'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import { Loader2, ArrowRight, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/Logo'
import { loginSchema, magicLinkSchema, recoverySchema, type LoginFormData, type MagicLinkFormData, type RecoveryFormData } from '@/lib/validations/auth'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'signin' | 'recovery'>('signin')
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)

  /* ── Sign-in form ── */
  const signInForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const handleLogin = async (data: LoginFormData) => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      if (error.message.includes('429') || error.status === 429) {
        toast.error('Too many attempts', { description: 'Try again in a few minutes.' })
      } else if (error.message.includes('Invalid login')) {
        toast.error('Invalid email or password')
      } else {
        toast.error('Sign in failed', { description: error.message })
      }
      return
    }

    window.location.href = '/dashboard'
  }

  /* ── Magic link form ── */
  const magicForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  })

  const handleMagicLink = async (data: MagicLinkFormData) => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      toast.error('Unable to send magic link', { description: error.message })
      return
    }

    setMagicSent(true)
    toast.success('Magic link sent', { description: `Check your inbox at ${data.email}` })
  }

  /* ── Recovery form ── */
  const recoveryForm = useForm<RecoveryFormData>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { email: '' },
  })

  const handleRecovery = async (data: RecoveryFormData) => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/auth/reset-password`,
    })

    if (error) {
      toast.error('Unable to send reset link', { description: error.message })
      return
    }

    setRecoverySent(true)
    toast.success('Reset link sent', { description: `Check your inbox at ${data.email}` })
  }

  const switchTab = (tab: 'signin' | 'recovery') => {
    setActiveTab(tab)
    setMagicSent(false)
    setRecoverySent(false)
    setUseMagicLink(false)
    signInForm.clearErrors()
    magicForm.clearErrors()
    recoveryForm.clearErrors()
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Brand ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0D1420] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C9A96E 1px, transparent 0)', backgroundSize: '40px 40px' }}
        />
        <div className="relative z-10 text-center max-w-md">
          <Logo size={64} variant="full" />
          <h2 className="mt-8 text-2xl font-bold text-[#F0F0F2]">Fashion Manufacturing QA</h2>
          <p className="mt-3 text-sm text-[#888890] leading-relaxed">
            AQL inspections, factory audits, and production planning for Garments, Footwear, Gloves, Headwear &amp; Accessories.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 text-left">
            {[
              'ANSI Z1.4 AQL Sampling',
              '35-point WRAP Audits',
              'Production Planning & DPR',
              'Real-time Quality Analytics',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-[#888890]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] mt-1 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <Logo size={36} variant="icon" />
            <span className="font-bold text-lg text-foreground">
              Sankalp<span className="text-primary">Hub</span>
            </span>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-8">
            {(['signin', 'recovery'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchTab(tab)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'signin' ? 'Sign In' : 'Password Recovery'}
              </button>
            ))}
          </div>

          {/* ── Sign In Tab ── */}
          {activeTab === 'signin' && (
            <>
              {magicSent ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    We sent a magic link to <span className="font-medium text-primary">{magicForm.getValues('email')}</span>. Click it to sign in.
                  </p>
                  <button type="button" onClick={() => setMagicSent(false)} className="text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors">
                    Use a different email
                  </button>
                </div>
              ) : useMagicLink ? (
                <form onSubmit={magicForm.handleSubmit(handleMagicLink)} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Sign in with magic link</h3>
                    <p className="text-sm text-muted-foreground mt-1">We&apos;ll email you a link to sign in — no password needed.</p>
                  </div>
                  <div>
                    <Label htmlFor="magic-email">Email address <span aria-hidden="true">*</span></Label>
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      autoFocus
                      aria-required="true"
                      aria-invalid={!!magicForm.formState.errors.email}
                      aria-describedby={magicForm.formState.errors.email ? 'magic-email-error' : undefined}
                      className="mt-1.5"
                      {...magicForm.register('email')}
                    />
                    {magicForm.formState.errors.email && (
                      <p id="magic-email-error" className="text-xs text-destructive mt-1" role="alert">{magicForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={magicForm.formState.isSubmitting}>
                    {magicForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {magicForm.formState.isSubmitting ? 'Sending...' : 'Send magic link'}
                  </Button>
                  <button type="button" onClick={() => setUseMagicLink(false)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to password sign in
                  </button>
                </form>
              ) : (
                <form onSubmit={signInForm.handleSubmit(handleLogin)} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Welcome back</h3>
                    <p className="text-sm text-muted-foreground mt-1">Sign in to your SankalpHub account.</p>
                  </div>
                  <div>
                    <Label htmlFor="login-email">Email address <span aria-hidden="true">*</span></Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      autoFocus
                      aria-required="true"
                      aria-invalid={!!signInForm.formState.errors.email}
                      aria-describedby={signInForm.formState.errors.email ? 'login-email-error' : undefined}
                      className="mt-1.5"
                      {...signInForm.register('email')}
                    />
                    {signInForm.formState.errors.email && (
                      <p id="login-email-error" className="text-xs text-destructive mt-1" role="alert">{signInForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password <span aria-hidden="true">*</span></Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-required="true"
                      aria-invalid={!!signInForm.formState.errors.password}
                      aria-describedby={signInForm.formState.errors.password ? 'login-password-error' : undefined}
                      className="mt-1.5"
                      {...signInForm.register('password')}
                    />
                    {signInForm.formState.errors.password && (
                      <p id="login-password-error" className="text-xs text-destructive mt-1" role="alert">{signInForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={signInForm.formState.isSubmitting}>
                    {signInForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {signInForm.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setUseMagicLink(true)}
                    className="w-full text-sm text-primary/80 hover:text-primary transition-colors text-center"
                  >
                    Sign in with magic link instead →
                  </button>
                </form>
              )}
            </>
          )}

          {/* ── Recovery Tab ── */}
          {activeTab === 'recovery' && (
            <>
              {recoverySent ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    We sent a password reset link to <span className="font-medium text-primary">{recoveryForm.getValues('email')}</span>.
                  </p>
                  <button type="button" onClick={() => setRecoverySent(false)} className="text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors">
                    Try a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={recoveryForm.handleSubmit(handleRecovery)} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Reset your password</h3>
                    <p className="text-sm text-muted-foreground mt-1">Enter your email and we&apos;ll send a reset link.</p>
                  </div>
                  <div>
                    <Label htmlFor="recovery-email">Email address <span aria-hidden="true">*</span></Label>
                    <Input
                      id="recovery-email"
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      autoFocus
                      aria-required="true"
                      aria-invalid={!!recoveryForm.formState.errors.email}
                      aria-describedby={recoveryForm.formState.errors.email ? 'recovery-email-error' : undefined}
                      className="mt-1.5"
                      {...recoveryForm.register('email')}
                    />
                    {recoveryForm.formState.errors.email && (
                      <p id="recovery-email-error" className="text-xs text-destructive mt-1" role="alert">{recoveryForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={recoveryForm.formState.isSubmitting}>
                    {recoveryForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {recoveryForm.formState.isSubmitting ? 'Sending...' : 'Send reset link'}
                  </Button>
                </form>
              )}
            </>
          )}

          {/* ── Signup link ── */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Start your free trial
            </Link>
          </p>

          {/* ── Footer ── */}
          <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
            © {new Date().getFullYear()} SankalpHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
