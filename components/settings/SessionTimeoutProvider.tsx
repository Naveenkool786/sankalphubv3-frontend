'use client'

import { useSessionTimeout } from '@/lib/session-timeout'

export function SessionTimeoutProvider({ role }: { role: string }) {
  const { state, secondsLeft, resetTimer } = useSessionTimeout(role)

  if (state === 'active') return null

  if (state === 'warning') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-amber-950 text-center py-2 text-sm font-medium animate-in slide-in-from-top">
        Your session will expire in {Math.ceil(secondsLeft / 60)} minutes due to inactivity.{' '}
        <button onClick={resetTimer} className="underline font-bold">Click to extend</button>
      </div>
    )
  }

  if (state === 'modal') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-sm text-center shadow-2xl">
          <div className="text-4xl font-bold text-destructive mb-2">{secondsLeft}s</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Session Expiring</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your session will expire in {secondsLeft} seconds due to inactivity. Any unsaved work may be lost.
          </p>
          <button
            onClick={resetTimer}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Extend Session
          </button>
        </div>
      </div>
    )
  }

  return null
}
