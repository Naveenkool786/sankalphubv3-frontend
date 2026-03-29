import { NextRequest, NextResponse } from 'next/server'
import { endImpersonationSession } from '@/app/console/impersonate/actions'

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    await endImpersonationSession(sessionId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[impersonate/end] Error:', err)
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 })
  }
}
