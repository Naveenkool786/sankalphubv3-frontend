'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Bell, Volume2, VolumeX, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const EVENT_CONFIG = [
  { event: 'inspection_passed', label: 'Inspection Passed', category: 'inspection_pass', defaultInApp: true, defaultSound: true, lockable: false },
  { event: 'inspection_failed', label: 'Inspection Failed', category: 'inspection_fail', defaultInApp: true, defaultSound: true, lockable: true },
  { event: 'critical_defect', label: 'Critical Defect Found', category: 'inspection_fail', defaultInApp: true, defaultSound: true, lockable: true },
  { event: 'order_assigned', label: 'New Project Created', category: 'brand', defaultInApp: true, defaultSound: true, lockable: false },
  { event: 'order_delayed', label: 'Order Delayed', category: 'factory', defaultInApp: true, defaultSound: true, lockable: true },
  { event: 'factory_at_capacity', label: 'Factory at Capacity', category: 'factory', defaultInApp: true, defaultSound: true, lockable: true },
  { event: 'audit_completed', label: 'Audit Completed', category: 'brand', defaultInApp: true, defaultSound: false, lockable: false },
  { event: 'audit_failed', label: 'Audit Failed (<70%)', category: 'inspection_fail', defaultInApp: true, defaultSound: true, lockable: true },
  { event: 'new_demo_request', label: 'Demo Request', category: 'system', defaultInApp: true, defaultSound: true, lockable: false },
  { event: 'new_user_signup', label: 'New User Signup', category: 'system', defaultInApp: true, defaultSound: false, lockable: false },
  { event: 'plan_upgraded', label: 'Plan Upgraded', category: 'brand', defaultInApp: true, defaultSound: false, lockable: false },
  { event: 'trial_expiring', label: 'Trial Expiring', category: 'system', defaultInApp: true, defaultSound: true, lockable: true },
  { event: 'production_behind', label: 'Production Behind Target', category: 'factory', defaultInApp: true, defaultSound: true, lockable: false },
  { event: 'report_submitted', label: 'Report Submitted', category: 'brand', defaultInApp: true, defaultSound: false, lockable: false },
  { event: 'report_approved', label: 'Report Approved', category: 'brand', defaultInApp: true, defaultSound: false, lockable: false },
]

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  brand: { bg: '#E6F1FB', color: '#185FA5' },
  factory: { bg: '#FAEEDA', color: '#854F0B' },
  inspection_pass: { bg: '#E1F5EE', color: '#1D9E75' },
  inspection_fail: { bg: '#FCEBEB', color: '#A32D2D' },
  system: { bg: '#EEEDFE', color: '#534AB7' },
}

export default function NotificationPreferencesPage() {
  const [masterSound, setMasterSound] = useState(true)
  const [quietStart, setQuietStart] = useState('22:00')
  const [quietEnd, setQuietEnd] = useState('07:00')
  const [prefs, setPrefs] = useState<Record<string, { inApp: boolean; sound: boolean }>>(
    Object.fromEntries(EVENT_CONFIG.map(e => [e.event, { inApp: e.defaultInApp, sound: e.defaultSound }]))
  )

  const togglePref = (event: string, field: 'inApp' | 'sound') => {
    const cfg = EVENT_CONFIG.find(e => e.event === event)
    if (field === 'inApp' && cfg?.lockable && prefs[event].inApp) {
      toast.error('Critical events cannot be disabled')
      return
    }
    setPrefs(prev => ({
      ...prev,
      [event]: { ...prev[event], [field]: !prev[event][field] },
    }))
  }

  const handleSave = () => {
    // Would save to profiles.notification_preferences
    toast.success('Notification preferences saved')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5" /> Notification Preferences
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Configure how you receive notifications</p>
      </div>

      {/* Global Sound Settings */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Sound Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {masterSound ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              <span className="text-sm font-medium">Master sound toggle</span>
            </div>
            <button
              onClick={() => setMasterSound(!masterSound)}
              className="w-9 h-5 rounded-full transition-colors relative"
              style={{ background: masterSound ? '#1D9E75' : 'var(--border)' }}
            >
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
                style={{ left: masterSound ? '18px' : '2px' }} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Quiet hours</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <input type="time" className="px-2 py-1 bg-muted border border-border rounded text-xs" value={quietStart} onChange={e => setQuietStart(e.target.value)} />
              <span className="text-muted-foreground">to</span>
              <input type="time" className="px-2 py-1 bg-muted border border-border rounded text-xs" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Per-Event Configuration */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Event Configuration</h3>
        </div>
        <div className="divide-y divide-border">
          {/* Header */}
          <div className="grid grid-cols-[1fr_60px_60px] px-5 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Event</span>
            <span className="text-center">In-App</span>
            <span className="text-center">Sound</span>
          </div>

          {EVENT_CONFIG.map(cfg => {
            const pref = prefs[cfg.event]
            const catColor = CATEGORY_COLORS[cfg.category]

            return (
              <div key={cfg.event} className="grid grid-cols-[1fr_60px_60px] px-5 py-3 items-center hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColor?.color }} />
                  <span className="text-sm text-foreground">{cfg.label}</span>
                  {cfg.lockable && <Badge variant="secondary" className="text-[9px] px-1 py-0">Required</Badge>}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => togglePref(cfg.event, 'inApp')}
                    className="w-8 h-[18px] rounded-full transition-colors relative"
                    style={{ background: pref.inApp ? '#1D9E75' : 'var(--border)' }}
                  >
                    <div className="absolute top-[1px] w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
                      style={{ left: pref.inApp ? '14px' : '2px' }} />
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => togglePref(cfg.event, 'sound')}
                    className="w-8 h-[18px] rounded-full transition-colors relative"
                    disabled={!masterSound}
                    style={{ background: pref.sound && masterSound ? '#1D9E75' : 'var(--border)', opacity: masterSound ? 1 : 0.4 }}
                  >
                    <div className="absolute top-[1px] w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
                      style={{ left: pref.sound && masterSound ? '14px' : '2px' }} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">Save Preferences</Button>
      </div>
    </div>
  )
}
