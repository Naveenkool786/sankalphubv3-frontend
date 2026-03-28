'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/Logo'
import { NavThemeToggle } from '@/components/ui/NavThemeToggle'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error('Sign in failed', { description: error.message })
    } else {
      router.push('/dashboard')
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      toast.error('Failed to send magic link', { description: error.message })
    } else {
      setSent(true)
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
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Logo size={48} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sign in to SankalpHub</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Quality inspection &amp; workflow management platform.
              </p>
            </div>
          </div>

          {sent ? (
            <div className="text-center space-y-2 p-6 rounded-xl border border-border bg-card">
              <p className="font-semibold">Check your email</p>
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <span className="font-medium text-foreground">{email}</span>.
                Click it to sign in.
              </p>
              <Button variant="ghost" size="sm" onClick={() => { setSent(false) }} className="mt-2">
                Use a different email
              </Button>
            </div>
          ) : useMagicLink ? (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send magic link'}
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
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
              <div className="flex flex-col items-center gap-2 text-center">
                <button
                  type="button"
                  onClick={() => setUseMagicLink(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in with magic link instead →
                </button>
                <a
                  href="/auth/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── RIGHT: Branding Panel (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #0D1420 0%, #060810 100%)' }}
      >
        <div>
          <Logo size={36} />
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
