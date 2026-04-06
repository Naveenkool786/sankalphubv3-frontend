'use client'

import { useState, useEffect } from 'react'
import { Mail, Clock, Shield, Bell, UserPlus, AlertTriangle, Archive, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { loadAutomationStates, toggleAutomation } from '../actions'

interface AutomationStep {
  id: string
  name: string
  trigger: string
  timing: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  defaultSubject: string
  defaultBody: string
}

interface AutomationCategory {
  id: string
  title: string
  description: string
  icon: React.ElementType
  steps: AutomationStep[]
}

const CATEGORIES: AutomationCategory[] = [
  {
    id: 'lifecycle',
    title: 'User Lifecycle Emails',
    description: 'Automated emails triggered by user signup and trial lifecycle events.',
    icon: UserPlus,
    steps: [
      {
        id: 'welcome',
        name: 'Welcome Email',
        trigger: 'New profile created',
        timing: 'Instant',
        icon: Mail,
        iconColor: '#10B981',
        iconBg: 'rgba(16,185,129,0.1)',
        defaultSubject: 'Welcome to SankalpHub!',
        defaultBody: 'Hi {{name}},\n\nWelcome to SankalpHub — the production intelligence platform for modern supply chains.\n\nYour 21-day trial starts now. Here\'s what you can do:\n• Create inspection templates with AI\n• Track factory quality in real-time\n• Generate automated PDF reports\n\nLet\'s get started!\n\n— The SankalpHub Team',
      },
      {
        id: 'trial_7d',
        name: 'Trial Expiring (7 days)',
        trigger: 'trial_end - 7 days',
        timing: 'Daily check',
        icon: Clock,
        iconColor: '#F59E0B',
        iconBg: 'rgba(245,158,11,0.1)',
        defaultSubject: 'Your trial ends in 7 days',
        defaultBody: 'Hi {{name}},\n\nYour SankalpHub trial expires in 7 days. You\'ve made great progress!\n\nUpgrade now to keep your data and unlock unlimited inspections.\n\n— The SankalpHub Team',
      },
      {
        id: 'trial_3d',
        name: 'Trial Expiring (3 days)',
        trigger: 'trial_end - 3 days',
        timing: 'Daily check',
        icon: Clock,
        iconColor: '#F59E0B',
        iconBg: 'rgba(245,158,11,0.1)',
        defaultSubject: '3 days left on your trial',
        defaultBody: 'Hi {{name}},\n\nJust 3 days left on your SankalpHub trial. Don\'t lose your inspection data and templates.\n\nUpgrade to PremiumHub →\n\n— The SankalpHub Team',
      },
      {
        id: 'trial_1d',
        name: 'Trial Expiring (1 day)',
        trigger: 'trial_end - 1 day',
        timing: 'Daily check',
        icon: AlertTriangle,
        iconColor: '#EF4444',
        iconBg: 'rgba(239,68,68,0.1)',
        defaultSubject: 'Last day of your trial',
        defaultBody: 'Hi {{name}},\n\nYour SankalpHub trial ends tomorrow. After that, your account will be limited to the Free plan.\n\nUpgrade now to keep full access →\n\n— The SankalpHub Team',
      },
      {
        id: 'trial_expired',
        name: 'Trial Expired',
        trigger: 'trial_end passed',
        timing: 'Daily check',
        icon: AlertTriangle,
        iconColor: '#EF4444',
        iconBg: 'rgba(239,68,68,0.1)',
        defaultSubject: 'Your trial has ended',
        defaultBody: 'Hi {{name}},\n\nYour SankalpHub trial has ended. Your data is safe, but some features are now limited.\n\nUpgrade anytime to restore full access.\n\n— The SankalpHub Team',
      },
      {
        id: 'upgrade_prompt',
        name: 'Upgrade Prompt',
        trigger: '14 days after signup, still on free',
        timing: 'Daily check',
        icon: Send,
        iconColor: '#8B5CF6',
        iconBg: 'rgba(139,92,246,0.1)',
        defaultSubject: 'Unlock premium features',
        defaultBody: 'Hi {{name}},\n\nYou\'ve been using SankalpHub for 2 weeks. Ready to unlock unlimited inspections, PDF reports, and AI-powered templates?\n\nUpgrade to PremiumHub →\n\n— The SankalpHub Team',
      },
    ],
  },
  {
    id: 'demo',
    title: 'Demo Follow-up Sequence',
    description: 'Automated email sequence when someone requests a demo from the website.',
    icon: Mail,
    steps: [
      {
        id: 'demo_confirm',
        name: 'Demo Confirmation',
        trigger: 'Demo request submitted',
        timing: 'Instant',
        icon: Mail,
        iconColor: '#10B981',
        iconBg: 'rgba(16,185,129,0.1)',
        defaultSubject: 'Thanks for requesting a demo!',
        defaultBody: 'Hi {{name}},\n\nThanks for your interest in SankalpHub! We received your demo request.\n\nOur team will reach out within 24 hours to schedule a personalized walkthrough.\n\nIn the meantime, here\'s what SankalpHub can do for your {{role}} workflow:\n• AI-powered inspection templates\n• Real-time quality tracking\n• Automated compliance reports\n\n— The SankalpHub Team',
      },
      {
        id: 'demo_followup',
        name: 'Follow-up',
        trigger: '+24 hours after demo request',
        timing: '+24h',
        icon: Clock,
        iconColor: '#3B82F6',
        iconBg: 'rgba(59,130,246,0.1)',
        defaultSubject: "Let's schedule your demo",
        defaultBody: 'Hi {{name}},\n\nJust following up on your demo request. We\'d love to show you how SankalpHub can streamline quality management for {{company}}.\n\nReply to this email or pick a time that works for you.\n\n— The SankalpHub Team',
      },
      {
        id: 'demo_checkin',
        name: 'Check-in',
        trigger: '+3 days after demo request',
        timing: '+3d',
        icon: Bell,
        iconColor: '#F59E0B',
        iconBg: 'rgba(245,158,11,0.1)',
        defaultSubject: "Still interested? Here's what you're missing",
        defaultBody: "Hi {{name}},\n\nWe noticed you haven't scheduled your demo yet. No worries — we're here when you're ready.\n\nHere's a quick preview of what other {{role}}s love about SankalpHub:\n• 60% faster inspection workflows\n• Zero paper reports\n• Real-time defect tracking\n\nReply anytime to get started.\n\n— The SankalpHub Team",
      },
    ],
  },
  {
    id: 'org_rules',
    title: 'Organization Management Rules',
    description: 'Automated rules for managing organizations and notifying the founder.',
    icon: Shield,
    steps: [
      {
        id: 'auto_deactivate',
        name: 'Auto-deactivate Expired Trial',
        trigger: 'trial_end passed + 3 day grace',
        timing: 'Daily check',
        icon: AlertTriangle,
        iconColor: '#EF4444',
        iconBg: 'rgba(239,68,68,0.1)',
        defaultSubject: '',
        defaultBody: 'Action: Set organization is_active = false when trial expires + 3 day grace period. No email sent — this is a system rule.',
      },
      {
        id: 'archive_inactive',
        name: 'Archive Inactive Orgs',
        trigger: 'No inspections/projects for 90 days',
        timing: 'Weekly check',
        icon: Archive,
        iconColor: '#6B7280',
        iconBg: 'rgba(107,114,128,0.1)',
        defaultSubject: '',
        defaultBody: 'Action: Flag organization as inactive after 90 days of no activity. Founder receives notification.',
      },
      {
        id: 'new_signup_alert',
        name: 'New Signup Alert',
        trigger: 'New organization created',
        timing: 'Instant',
        icon: UserPlus,
        iconColor: '#10B981',
        iconBg: 'rgba(16,185,129,0.1)',
        defaultSubject: 'New org signup: {{org_name}}',
        defaultBody: 'A new organization has signed up:\n\nOrg: {{org_name}}\nType: {{org_type}}\nPlan: {{plan}}\n\n— SankalpHub System',
      },
      {
        id: 'new_demo_alert',
        name: 'New Demo Request Alert',
        trigger: 'Demo request submitted',
        timing: 'Instant',
        icon: Bell,
        iconColor: '#3B82F6',
        iconBg: 'rgba(59,130,246,0.1)',
        defaultSubject: 'New demo request from {{name}}',
        defaultBody: 'New demo request received:\n\nName: {{name}}\nCompany: {{company}}\nRole: {{role}}\nEmail: {{email}}\n\n— SankalpHub System',
      },
    ],
  },
]

export function AutomationsClient() {
  const [enabledSteps, setEnabledSteps] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    CATEGORIES.forEach((cat) => cat.steps.forEach((step) => {
      initial[step.id] = false
    }))
    return initial
  })

  // Load persisted automation states from database on mount
  useEffect(() => {
    loadAutomationStates().then((saved) => {
      if (Object.keys(saved).length > 0) {
        setEnabledSteps((prev) => ({ ...prev, ...saved }))
      }
    })
  }, [])

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    lifecycle: true,
    demo: true,
    org_rules: true,
  })

  const [editingStep, setEditingStep] = useState<AutomationStep | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')

  async function toggleStep(stepId: string) {
    const newEnabled = !enabledSteps[stepId]
    // Optimistic update
    setEnabledSteps((prev) => ({ ...prev, [stepId]: newEnabled }))

    const { success, error } = await toggleAutomation(stepId, newEnabled)
    if (success) {
      toast.success(newEnabled ? 'Automation enabled' : 'Automation disabled')
    } else {
      // Revert on failure
      setEnabledSteps((prev) => ({ ...prev, [stepId]: !newEnabled }))
      toast.error('Failed to save', { description: error || 'Please try again.' })
    }
  }

  function toggleCategory(catId: string) {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }))
  }

  function openEditor(step: AutomationStep) {
    setEditingStep(step)
    setEditSubject(step.defaultSubject)
    setEditBody(step.defaultBody)
  }

  function saveTemplate() {
    toast.success('Template saved', { description: `Updated "${editingStep?.name}" template.` })
    setEditingStep(null)
  }

  const totalEnabled = Object.values(enabledSteps).filter(Boolean).length
  const totalSteps = Object.keys(enabledSteps).length

  return (
    <>
      {/* Summary bar */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border border-border bg-card">
        <div className="flex-1">
          <span className="text-sm font-medium text-foreground">{totalEnabled} of {totalSteps} automations active</span>
          <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(totalEnabled / totalSteps) * 100}%`, backgroundColor: '#C9A96E' }}
            />
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="space-y-5">
        {CATEGORIES.map((cat) => {
          const CatIcon = cat.icon
          const catEnabled = cat.steps.filter((s) => enabledSteps[s.id]).length
          const isExpanded = expandedCategories[cat.id]

          return (
            <div key={cat.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-accent/30 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,169,110,0.1)' }}>
                  <CatIcon className="w-4.5 h-4.5" style={{ color: '#C9A96E' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{cat.title}</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {catEnabled}/{cat.steps.length} active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {/* Steps */}
              {isExpanded && (
                <div className="border-t border-border">
                  {cat.steps.map((step, idx) => {
                    const StepIcon = step.icon
                    const isEnabled = enabledSteps[step.id]

                    return (
                      <div
                        key={step.id}
                        className={cn(
                          'flex items-center gap-4 px-5 py-3.5 transition-colors',
                          idx < cat.steps.length - 1 && 'border-b border-border/50'
                        )}
                      >
                        {/* Step icon with connector line */}
                        <div className="flex flex-col items-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: step.iconBg }}
                          >
                            <StepIcon className="w-4 h-4" style={{ color: step.iconColor }} />
                          </div>
                        </div>

                        {/* Step info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{step.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {step.trigger} · <span className="font-medium">{step.timing}</span>
                          </p>
                        </div>

                        {/* Status dot */}
                        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isEnabled ? 'bg-emerald-500' : 'bg-zinc-400')} />

                        {/* Edit template */}
                        {step.defaultSubject && (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openEditor(step)}>
                            Edit Template
                          </Button>
                        )}

                        {/* Toggle */}
                        <Switch checked={isEnabled} onCheckedChange={() => toggleStep(step.id)} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Template Editor Sheet */}
      <Sheet open={!!editingStep} onOpenChange={() => setEditingStep(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit Template — {editingStep?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Subject Line</Label>
              <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email Body</Label>
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="min-h-[300px] font-mono text-xs"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Available variables: {'{{name}}'}, {'{{email}}'}, {'{{company}}'}, {'{{role}}'}, {'{{org_name}}'}, {'{{org_type}}'}, {'{{plan}}'}
            </p>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingStep(null)}>Cancel</Button>
            <Button onClick={saveTemplate}>Save Template</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
