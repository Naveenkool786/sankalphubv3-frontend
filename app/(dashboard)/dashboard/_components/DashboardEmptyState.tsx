'use client'

import Link from 'next/link'
import { CheckCircle2, Factory, FolderKanban, FileText, ClipboardCheck, Users } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

interface Props {
  firstName: string
  factoryCount: number
  projectCount: number
  templateCount: number
  inspectionCount: number
  teamCount: number
}

const STEPS = [
  { title: 'Create your account', subtitle: 'Organisation set up · Role selected', href: '', icon: CheckCircle2 },
  { title: 'Add your first factory', subtitle: 'Connect your manufacturing partner', href: '/factories', icon: Factory },
  { title: 'Create your first project', subtitle: 'Set up season, styles, and deadlines', href: '/projects', icon: FolderKanban },
  { title: 'Build an inspection template', subtitle: 'Garments · Footwear · Gloves · Headwear', href: '/settings/templates', icon: FileText },
  { title: 'Run your first inspection', subtitle: 'Live AQL scoring · Defect logging · PDF report', href: '/inspections', icon: ClipboardCheck },
  { title: 'Invite your team', subtitle: 'Brand Manager · Inspector · Factory Manager', href: '/settings/users', icon: Users },
]

export function DashboardEmptyState({ firstName, factoryCount, projectCount, templateCount, inspectionCount, teamCount }: Props) {
  const completedSteps = [
    true, // Step 1: always done
    factoryCount > 0,
    projectCount > 0,
    templateCount > 0,
    inspectionCount > 0,
    teamCount > 1,
  ]

  const firstIncomplete = completedSteps.findIndex(s => !s)

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      {/* Logo + welcome */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size={48} variant="icon" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Welcome to SankalpHub{firstName ? `, ${firstName}` : ''}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Your quality dashboard is ready. Complete these steps to get started.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{projectCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active projects</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{inspectionCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Inspections run</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const done = completedSteps[i]
          const isCurrent = i === firstIncomplete
          const isLocked = i > firstIncomplete && firstIncomplete !== -1

          return (
            <div
              key={i}
              className={cn(
                'rounded-lg border bg-card px-3.5 py-3 flex items-center gap-3 transition-colors',
                done && 'opacity-50',
                isCurrent && 'hover:border-[#C9A96E]',
                isLocked && 'opacity-50',
              )}
              style={{ borderColor: isCurrent ? 'rgba(201,169,110,0.4)' : undefined }}
            >
              {/* Number / check */}
              {done ? (
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#E1F5EE' }}>
                  <CheckCircle2 size={14} style={{ color: '#1D9E75' }} />
                </div>
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={isCurrent
                    ? { backgroundColor: '#BA7517', color: '#fff' }
                    : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                  }
                >
                  {i + 1}
                </div>
              )}

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-[13px] font-medium text-foreground', done && 'line-through')}>{step.title}</p>
                <p className="text-[11px] text-muted-foreground">{step.subtitle}</p>
              </div>

              {/* Action */}
              {done ? (
                <span className="text-[11px] font-medium" style={{ color: '#1D9E75' }}>Done</span>
              ) : step.href ? (
                <Link
                  href={step.href}
                  className="text-[11px] font-medium shrink-0"
                  style={{ color: isCurrent ? '#C9A96E' : 'hsl(var(--muted-foreground))' }}
                >
                  Get started →
                </Link>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
