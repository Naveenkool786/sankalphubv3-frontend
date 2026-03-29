'use client'

import { useEffect, useState } from 'react'

interface ImpersonationState {
  sessionId: string
  targetUserId: string
  targetUserName: string
  targetOrgName: string
  targetRole: string
  startedAt: string
}

export function ImpersonationBanner() {
  const [imp, setImp] = useState<ImpersonationState | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('impersonating')
    if (stored) {
      try { setImp(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  if (!imp) return null

  const handleExit = async () => {
    try {
      await fetch('/api/console/impersonate/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: imp.sessionId }),
      })
    } catch { /* best effort */ }
    sessionStorage.removeItem('impersonating')
    window.location.href = '/console/impersonate'
  }

  return (
    <>
      {/* Top banner */}
      <div className="sticky top-0 z-[100] flex items-center gap-2.5 px-4 py-2 text-xs text-white" style={{ background: '#1a1a2e' }}>
        <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: '#EF9F27' }} />
        <span className="flex-1">
          Viewing as <strong style={{ color: '#EDD898' }}>{imp.targetUserName}</strong>
          {' '}({imp.targetRole.replace(/_/g, ' ')} &middot; {imp.targetOrgName}) — You are in impersonation mode.
        </span>
        <button
          onClick={handleExit}
          className="text-[11px] font-medium px-3 py-1 rounded-md cursor-pointer"
          style={{ background: '#E24B4A', color: '#fff', border: 'none' }}
        >
          Exit impersonation
        </button>
      </div>

      {/* Floating exit button */}
      <button
        onClick={handleExit}
        className="fixed bottom-6 right-6 z-[200] flex items-center gap-1.5 text-[11px] font-medium px-3.5 py-2 rounded-full cursor-pointer"
        style={{ background: '#E24B4A', color: '#fff', boxShadow: '0 2px 8px rgba(226,75,74,0.4)' }}
      >
        &larr; Exit &middot; {imp.targetUserName}
      </button>
    </>
  )
}
