'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const ROLE_TIMEOUTS: Record<string, number> = {
  inspector: 30 * 60 * 1000,
  factory_manager: 30 * 60 * 1000,
  brand_manager: 60 * 60 * 1000,
  super_admin: 60 * 60 * 1000,
  viewer: 45 * 60 * 1000,
}

const WARNING_BEFORE = 5 * 60 * 1000 // 5 min before
const MODAL_BEFORE = 1 * 60 * 1000   // 1 min before

export type TimeoutState = 'active' | 'warning' | 'modal' | 'expired'

export function useSessionTimeout(role: string) {
  const timeout = ROLE_TIMEOUTS[role] || 45 * 60 * 1000
  const [state, setState] = useState<TimeoutState>('active')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const lastActivityRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    setState('active')
  }, [])

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login?expired=1'
  }, [])

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
    const handler = () => {
      if (state !== 'expired') {
        lastActivityRef.current = Date.now()
        if (state === 'warning') setState('active')
      }
    }

    events.forEach(e => window.addEventListener(e, handler, { passive: true }))

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = timeout - elapsed

      if (remaining <= 0) {
        setState('expired')
        handleLogout()
      } else if (remaining <= MODAL_BEFORE) {
        setState('modal')
        setSecondsLeft(Math.ceil(remaining / 1000))
      } else if (remaining <= WARNING_BEFORE) {
        setState('warning')
        setSecondsLeft(Math.ceil(remaining / 1000))
      } else {
        setState('active')
      }
    }, 1000)

    return () => {
      events.forEach(e => window.removeEventListener(e, handler))
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timeout, state, handleLogout])

  return { state, secondsLeft, resetTimer, handleLogout }
}
