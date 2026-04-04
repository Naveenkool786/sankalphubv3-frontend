import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Factory, MapPin, Shield, Mail, Phone, User, ArrowLeft, BarChart3, ClipboardCheck, FolderKanban, AlertTriangle } from 'lucide-react'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function FactoryProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  // Use service role client to bypass RLS (same pattern as factories list page)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : await createClient()

  const { data: factory } = await (supabase.from('factories') as any)
    .select('*')
    .eq('id', id)
    .eq('org_id', ctx.orgId)
    .single()

  if (!factory) notFound()

  // Fetch inspections for this factory
  const { data: inspections } = await (supabase.from('inspections') as any)
    .select('*')
    .eq('factory_id', id)
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch projects assigned to this factory
  const { data: projects } = await (supabase.from('projects') as any)
    .select('*')
    .eq('factory_id', id)
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: false })

  // Fetch defects — table may not exist yet
  const inspectionIds = ((inspections ?? []) as any[]).map((i: any) => i.id)
  let defects: any[] | null = null
  if (inspectionIds.length > 0) {
    const { data, error } = await (supabase.from('defect_records') as any)
      .select('*')
      .eq('org_id', ctx.orgId)
      .in('inspection_id', inspectionIds)
      .order('created_at', { ascending: false })
      .limit(5)
    if (!error) defects = data
  }

  // Calculate stats
  const allInspections = (inspections ?? []) as any[]
  const totalInspections = allInspections.length
  const passed = allInspections.filter((i: any) => i.result === 'pass').length
  const failed = allInspections.filter((i: any) => i.result === 'fail').length
  const passRate = totalInspections > 0 ? Math.round((passed / totalInspections) * 100) : null

  const certs: string[] = Array.isArray(factory.certifications) ? factory.certifications : typeof factory.certifications === 'string' ? factory.certifications.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  const allProjects = (projects ?? []) as any[]
  const allDefects = (defects ?? []) as any[]

  const passRateColor = passRate === null ? '#6B7280' : passRate >= 80 ? '#16a34a' : passRate >= 60 ? '#d97706' : '#dc2626'

  return (
    <div className="p-6 lg:p-8">
      {/* Back */}
      <Link href="/factories" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Factories
      </Link>

      {/* ── Section 1: Header ── */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
          {factory.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{factory.name}</h1>
          {(factory.city || factory.country) && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {[factory.city, factory.country].filter(Boolean).join(', ')}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={factory.is_active ? 'default' : 'secondary'}>
              {factory.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {factory.code && <Badge variant="secondary">{factory.code}</Badge>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Section 2: Contact ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {factory.contact_name && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-3.5 h-3.5 flex-shrink-0" /> {factory.contact_name}
                </div>
              )}
              {factory.contact_email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <a href={`mailto:${factory.contact_email}`} className="hover:text-foreground transition-colors">{factory.contact_email}</a>
                </div>
              )}
              {factory.contact_phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" /> {factory.contact_phone}
                </div>
              )}
              {factory.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {factory.address}
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Certifications ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Certifications
            </h2>
            {certs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {certs.map((cert) => (
                  <Badge key={cert} variant="secondary">{cert}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No certifications listed</p>
            )}
          </div>

          {/* ── Section 4B: Open Defects (Pattern 2) ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Open Defects
            </h2>
            {allDefects.length > 0 ? (
              <div className="space-y-2">
                {allDefects.map((defect: any) => {
                  const sev = defect.severity as string
                  const sevConfig = sev === 'critical'
                    ? { border: 'border-red-200 dark:border-red-900/40', bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' }
                    : sev === 'major'
                    ? { border: 'border-amber-200 dark:border-amber-900/40', bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' }
                    : { border: 'border-blue-200 dark:border-blue-900/40', bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' }

                  return (
                    <div key={defect.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', sevConfig.border, sevConfig.bg)}>
                      <AlertTriangle className={cn('w-4 h-4 mt-0.5 flex-shrink-0', sevConfig.text)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn('text-xs font-semibold truncate', sevConfig.text)}>{defect.description || 'Defect'}</p>
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', sevConfig.badge)}>{sev}</span>
                        </div>
                        {defect.location && <p className="text-[11px] text-muted-foreground mt-0.5">{defect.location}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                No open defects
              </div>
            )}
          </div>

          {/* ── Section 5: Recent Inspections ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary" /> Recent Inspections
            </h2>
            {allInspections.length > 0 ? (
              <div className="divide-y divide-border">
                {allInspections.map((insp: any) => (
                  <div key={insp.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{insp.inspection_no || 'Inspection'}</p>
                      <p className="text-muted-foreground">{new Date(insp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {insp.score !== null && <span className="text-muted-foreground">Score: {insp.score}</span>}
                      <Badge variant="secondary" className={cn('text-[10px]',
                        insp.result === 'pass' ? 'bg-emerald-500/10 text-emerald-600' :
                        insp.result === 'fail' ? 'bg-red-500/10 text-red-600' :
                        'bg-zinc-500/10 text-zinc-600'
                      )}>
                        {insp.result || insp.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No inspections yet</p>
            )}
          </div>

          {/* ── Section 6: Assigned Projects ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" /> Assigned Projects
            </h2>
            {allProjects.length > 0 ? (
              <div className="divide-y divide-border">
                {allProjects.map((proj: any) => (
                  <div key={proj.id} className="flex items-center justify-between py-2.5 text-xs">
                    <p className="font-medium text-foreground">{proj.name}</p>
                    <Badge variant="secondary" className="text-[10px] capitalize">{proj.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Not assigned to any projects yet</p>
            )}
          </div>
        </div>

        {/* Right Column (1/3) — Performance */}
        <div className="space-y-6">
          {/* Performance Donut (Pattern 6) */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Performance
            </h2>
            <div className="flex flex-col items-center mb-4">
              {/* SVG Semi-donut */}
              <svg viewBox="0 0 160 100" width="160" height="100">
                {/* Background arc */}
                <path
                  d="M 8 90 A 72 72 0 0 1 152 90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="14"
                  className="text-muted/30"
                  strokeLinecap="round"
                />
                {/* Value arc */}
                {passRate !== null && passRate > 0 && (
                  <path
                    d={describeArc(80, 90, 72, 180, 180 + (passRate / 100) * 180)}
                    fill="none"
                    stroke={passRateColor}
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="flex flex-col items-center -mt-4">
                <span className="text-3xl font-bold" style={{ color: passRateColor }}>
                  {passRate !== null ? `${passRate}%` : '—'}
                </span>
                <span className="text-xs text-muted-foreground">Avg Pass Rate</span>
              </div>
            </div>

            {/* Stats below donut */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{totalInspections}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600">{passed}</p>
                <p className="text-[10px] text-muted-foreground">Passed</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">{failed}</p>
                <p className="text-[10px] text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>

          {/* Live Status (Pattern 7) */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span>Live data</span>
            <span>·</span>
            <span>{totalInspections} inspections tracked</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// SVG arc helper
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
