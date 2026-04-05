'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

/* ── Sacred Orbit Logo ── */
function SacredOrbitLogo({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EDD898" />
          <stop offset="100%" stopColor="#A87C30" />
        </linearGradient>
        <linearGradient id="dI" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5E6B0" />
          <stop offset="100%" stopColor="#C9A96E" />
        </linearGradient>
        <linearGradient id="nG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A96E" />
          <stop offset="100%" stopColor="#8B6520" />
        </linearGradient>
      </defs>
      <ellipse cx="70" cy="70" rx="62" ry="22" fill="none" stroke="#C9A96E" strokeWidth="0.8" opacity="0.25" transform="rotate(-40 70 70)" />
      <ellipse cx="70" cy="70" rx="62" ry="22" fill="none" stroke="#C9A96E" strokeWidth="0.8" opacity="0.4" transform="rotate(20 70 70)" />
      <ellipse cx="70" cy="70" rx="62" ry="22" fill="none" stroke="#C9A96E" strokeWidth="0.8" opacity="0.2" transform="rotate(80 70 70)" />
      <circle cx="70" cy="70" r="60" fill="none" stroke="#C9A96E" strokeWidth="0.4" opacity="0.15" />
      <polygon points="70,14 116,70 70,122 24,70" fill="none" stroke="url(#dG)" strokeWidth="1.2" opacity="0.6" />
      <polygon points="70,30 104,70 70,106 36,70" fill="none" stroke="url(#dG)" strokeWidth="1" opacity="0.9" />
      <polygon points="70,44 96,70 70,94 44,70" fill="url(#dI)" opacity="0.12" />
      <polygon points="70,44 96,70 70,94 44,70" fill="none" stroke="url(#dG)" strokeWidth="1.5" />
      <circle cx="70" cy="8" r="4" fill="url(#nG)" />
      <circle cx="124" cy="88" r="3" fill="url(#nG)" opacity="0.7" />
      <circle cx="16" cy="88" r="3" fill="url(#nG)" opacity="0.7" />
      <line x1="70" y1="8" x2="70" y2="44" stroke="#C9A96E" strokeWidth="0.5" opacity="0.3" />
      <line x1="124" y1="88" x2="96" y2="70" stroke="#C9A96E" strokeWidth="0.5" opacity="0.2" />
      <line x1="16" y1="88" x2="44" y2="70" stroke="#C9A96E" strokeWidth="0.5" opacity="0.2" />
      <circle cx="70" cy="70" r="11" fill="none" stroke="#C9A96E" strokeWidth="0.8" opacity="0.5" />
      <circle cx="70" cy="70" r="6" fill="url(#dG)" />
      <circle cx="70" cy="70" r="2.5" fill="#EDD898" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'signin' | 'recovery'>('signin')
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)

  function getSupabase() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = getSupabase()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      window.location.href = '/dashboard'
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = getSupabase()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (otpError) {
      setError(otpError.message)
    } else {
      setMagicSent(true)
    }
  }

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = getSupabase()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/auth/reset-password`,
    })
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
    } else {
      setRecoverySent(true)
    }
  }

  /* ── Shared styles ── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    color: '#888',
    fontSize: '13px',
    display: 'block',
    marginBottom: '6px',
    fontWeight: 500,
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080808',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px',
    }}>
      <div style={{
        background: '#111',
        border: '1px solid #1a1a1a',
        borderRadius: '20px',
        padding: '40px 36px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* ── Logo + Branding ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <SacredOrbitLogo size={64} />
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: 600, letterSpacing: '-0.3px' }}>
            <span style={{ color: '#EDE0C8' }}>Sankalp</span>
            <span style={{ color: '#C9A96E' }}>Hub</span>
          </h1>
          <p style={{
            color: '#4A4030',
            fontSize: '9px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            margin: '8px 0 0',
            fontWeight: 600,
          }}>
            Production Intelligence Platform
          </p>
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          background: '#0a0a0a',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '28px',
        }}>
          {(['signin', 'recovery'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setError(''); setMagicSent(false); setRecoverySent(false); setUseMagicLink(false) }}
              style={{
                padding: '8px 0',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === tab ? '#1a1a1a' : 'transparent',
                color: activeTab === tab ? '#EDE0C8' : '#555',
              }}
            >
              {tab === 'signin' ? 'Sign In' : 'Password Recovery'}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div role="alert" style={{
            background: '#1a0f0f',
            border: '1px solid #3a1515',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#E24B4A',
            fontSize: '13px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {/* ── Sign In Tab ── */}
        {activeTab === 'signin' && (
          <>
            {magicSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: '#EDE0C8', fontWeight: 600, marginBottom: '8px' }}>Check your email</p>
                <p style={{ color: '#666', fontSize: '13px', lineHeight: '1.6' }}>
                  We sent a magic link to{' '}
                  <span style={{ color: '#C9A96E' }}>{email}</span>.
                  Click it to sign in.
                </p>
                <button
                  type="button"
                  onClick={() => setMagicSent(false)}
                  style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', cursor: 'pointer', marginTop: '16px' }}
                >
                  Use a different email
                </button>
              </div>
            ) : useMagicLink ? (
              <form onSubmit={handleMagicLink}>
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="magic-email" style={labelStyle}>Email address <span aria-hidden="true">*</span></label>
                  <input
                    id="magic-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    aria-required="true"
                    autoComplete="email"
                    autoFocus
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#C9A96E'}
                    onBlur={e => e.target.style.borderColor = '#222'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '44px',
                    background: loading ? '#6b5a2e' : '#BA7517',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    marginBottom: '16px',
                  }}
                >
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
                <button
                  type="button"
                  onClick={() => setUseMagicLink(false)}
                  style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', cursor: 'pointer', width: '100%', textAlign: 'center' }}
                >
                  ← Back to password sign in
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="login-email" style={labelStyle}>Email address <span aria-hidden="true">*</span></label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    aria-required="true"
                    autoComplete="email"
                    autoFocus
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#C9A96E'}
                    onBlur={e => e.target.style.borderColor = '#222'}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label htmlFor="login-password" style={labelStyle}>Password <span aria-hidden="true">*</span></label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    aria-required="true"
                    autoComplete="current-password"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#C9A96E'}
                    onBlur={e => e.target.style.borderColor = '#222'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '44px',
                    background: loading ? '#6b5a2e' : '#BA7517',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    marginBottom: '16px',
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <button
                  type="button"
                  onClick={() => setUseMagicLink(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C9A96E',
                    fontSize: '13px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'center',
                    opacity: 0.8,
                  }}
                >
                  Sign in with magic link instead →
                </button>
              </form>
            )}
          </>
        )}

        {/* ── Password Recovery Tab ── */}
        {activeTab === 'recovery' && (
          <>
            {recoverySent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: '#EDE0C8', fontWeight: 600, marginBottom: '8px' }}>Check your email</p>
                <p style={{ color: '#666', fontSize: '13px', lineHeight: '1.6' }}>
                  We sent a password reset link to{' '}
                  <span style={{ color: '#C9A96E' }}>{email}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => setRecoverySent(false)}
                  style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', cursor: 'pointer', marginTop: '16px' }}
                >
                  Try a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecovery}>
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
                  Enter your email and we&apos;ll send a reset link.
                </p>
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="recovery-email" style={labelStyle}>Email address <span aria-hidden="true">*</span></label>
                  <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    aria-required="true"
                    autoComplete="email"
                    autoFocus
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#C9A96E'}
                    onBlur={e => e.target.style.borderColor = '#222'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '44px',
                    background: loading ? '#6b5a2e' : '#BA7517',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            )}
          </>
        )}

        {/* ── Footer ── */}
        <p style={{
          textAlign: 'center',
          color: '#2a2a2a',
          fontSize: '11px',
          marginTop: '32px',
          marginBottom: 0,
        }}>
          © {new Date().getFullYear()} SankalpHub. All rights reserved.
        </p>
      </div>
    </div>
  )
}
