'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Login attempt started')
    console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Auth result:', { data: !!data?.user, error: authError?.message })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      console.log('Login success - redirecting to dashboard')
      window.location.href = '/dashboard'
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#111',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{ color: '#C9A96E', marginBottom: '8px', fontSize: '24px' }}>
          SankalpHub
        </h1>
        <p style={{ color: '#888', marginBottom: '32px', fontSize: '14px' }}>
          Sign in to your account
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#3d1515',
              border: '1px solid #E24B4A',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#E24B4A',
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '44px',
              background: loading ? '#888' : '#BA7517',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
