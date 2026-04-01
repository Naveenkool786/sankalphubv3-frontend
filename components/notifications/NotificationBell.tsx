'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Bell, AlertTriangle, XCircle, CheckCircle2, Clock, Building2,
  FileText, CheckSquare, FilePlus, UserPlus, Star, Volume2, VolumeX,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { playFounderRipple } from '@/lib/sounds/founderSound'

/* ─── TYPES ─── */

interface Notification {
  id: string
  event_type: string
  sound_category: 'brand' | 'factory' | 'inspection_pass' | 'inspection_fail' | 'system'
  title: string
  detail: string | null
  link: string | null
  is_read: boolean
  is_critical: boolean
  created_at: string
}

/* ─── CONSTANTS ─── */

const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  brand: { bg: '#E6F1FB', color: '#185FA5' },
  factory: { bg: '#FAEEDA', color: '#854F0B' },
  inspection_pass: { bg: '#E1F5EE', color: '#1D9E75' },
  inspection_fail: { bg: '#FCEBEB', color: '#A32D2D' },
  system: { bg: '#EEEDFE', color: '#534AB7' },
}

const EVENT_ICON: Record<string, typeof Bell> = {
  critical_defect: AlertTriangle,
  inspection_failed: XCircle,
  inspection_passed: CheckCircle2,
  order_delayed: Clock,
  factory_at_capacity: Building2,
  report_submitted: FileText,
  report_approved: CheckSquare,
  new_demo_request: FilePlus,
  new_user_signup: UserPlus,
  plan_upgraded: Star,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

/* ─── COMPONENT ─── */

export function NotificationBell() {
  const router = useRouter()
  const pathname = usePathname()
  const isConsole = pathname.startsWith('/console')
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'info'>('all')
  const panelRef = useRef<HTMLDivElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  /* ── SOUND ENGINE ── */
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }, [])

  const playSound = useCallback((category: string, isCritical: boolean) => {
    if (!soundEnabled) return
    if (criticalOnly && !isCritical) return

    // Founder Console — exclusive "Still pond ripple" sound
    if (isConsole) {
      playFounderRipple()
      return
    }

    try {
      const ctx = getAudioContext()
      const playNotes = (notes: [number, number][], type: OscillatorType, vol: number, dur: number) => {
        notes.forEach(([freq, t]) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g); g.connect(ctx.destination)
          o.type = type; o.frequency.value = freq
          g.gain.setValueAtTime(vol, ctx.currentTime + t)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur)
          o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + dur)
        })
      }
      switch (category) {
        case 'brand': playNotes([[523, 0], [659, 0.16], [784, 0.32]], 'sine', 0.28, 0.8); break
        case 'factory': playNotes([[294, 0], [392, 0.2], [294, 0.4]], 'triangle', 0.32, 0.5); break
        case 'inspection_pass': playNotes([[659, 0], [784, 0.14], [988, 0.28]], 'sine', 0.25, 0.6); break
        case 'inspection_fail': playNotes([[880, 0], [698, 0.16], [523, 0.32]], 'sine', 0.30, 0.5); break
        case 'system': {
          const o = ctx.createOscillator(), g = ctx.createGain()
          o.connect(g); g.connect(ctx.destination); o.type = 'sine'
          o.frequency.setValueAtTime(660, ctx.currentTime)
          o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.04)
          g.gain.setValueAtTime(0.28, ctx.currentTime)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
          o.start(); o.stop(ctx.currentTime + 0.18)
          break
        }
      }
    } catch { /* never crash */ }
  }, [soundEnabled, criticalOnly, isConsole, getAudioContext])

  /* ── DATA + REALTIME ── */
  useEffect(() => {
    const supabase = createClient()

    async function fetch() {
      try {
        const { data } = await (supabase.from('notifications') as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        if (data) setNotifications(data)
      } catch { /* silent */ }
    }
    fetch()

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: any) => {
        const n = payload.new as Notification
        setNotifications(prev => [n, ...prev])
        playSound(n.sound_category, n.is_critical)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [playSound])

  /* ── CLOSE ON OUTSIDE CLICK ── */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* ── MARK READ ── */
  async function markRead(id: string) {
    const supabase = createClient()
    await (supabase.from('notifications') as any).update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    const supabase = createClient()
    await (supabase.from('notifications') as any).update({ is_read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const filtered = notifications.filter(n => {
    if (activeTab === 'critical') return n.is_critical
    if (activeTab === 'info') return !n.is_critical
    return true
  })

  const TABS: { key: typeof activeTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'critical', label: 'Critical' },
    { key: 'info', label: 'Info' },
  ]

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center relative transition-all border',
          open ? 'border-[#C9A96E] bg-[#FAEEDA]' : 'border-border bg-card hover:bg-accent',
        )}
      >
        <Bell size={16} className={open ? 'text-[#BA7517]' : 'text-muted-foreground'} />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E24B4A] opacity-0 animate-[notif-pulse_2s_infinite]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E24B4A] text-white text-[9px] font-medium flex items-center justify-center border-2 border-background">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-10 w-[340px] max-h-[480px] rounded-xl border border-border bg-card shadow-xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#E24B4A] text-white">{unreadCount}</span>
              )}
            </div>
            <button onClick={markAllRead} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              Mark all read
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 py-2 text-xs font-medium transition-colors',
                  activeTab === tab.key
                    ? 'text-[#BA7517] border-b-2 border-[#BA7517]'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto max-h-[320px]">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No notifications</div>
            ) : (
              filtered.map(n => {
                const catStyle = CATEGORY_STYLE[n.sound_category] ?? CATEGORY_STYLE.system
                const Icon = EVENT_ICON[n.event_type] ?? Bell
                return (
                  <button
                    key={n.id}
                    onClick={() => { markRead(n.id); if (n.link) { router.push(n.link); setOpen(false) } }}
                    className={cn(
                      'w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors border-b border-border last:border-0 hover:bg-accent/30',
                      !n.is_read && 'bg-[#FAFAF8] dark:bg-accent/10',
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: catStyle.bg }}>
                      <Icon size={14} style={{ color: catStyle.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{n.title}</p>
                      {n.detail && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{n.detail}</p>}
                      <p className="text-[9px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#E24B4A] shrink-0 mt-2" />}
                  </button>
                )
              })
            )}
          </div>

          {/* Settings */}
          <div className="px-4 py-2.5 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Sound notifications</span>
              <Toggle checked={soundEnabled} onChange={setSoundEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Critical events only</span>
              <Toggle checked={criticalOnly} onChange={setCriticalOnly} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes notif-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

/* ─── TOGGLE ─── */

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-9 h-5 rounded-full transition-colors relative"
      style={{ backgroundColor: checked ? '#1D9E75' : 'hsl(var(--border))' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
        style={{ left: checked ? '18px' : '2px' }}
      />
    </button>
  )
}
