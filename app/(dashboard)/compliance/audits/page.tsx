import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import Link from 'next/link'
import { FileCheck, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AUDIT_STATUS_CONFIG, AUDIT_TYPE_CONFIG, RATING_CONFIG, type AuditStatus, type AuditRating, type AuditType } from '@/lib/types/compliance'

export default async function AuditsPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const { data: audits } = await (supabase.from('factory_audits') as any)
    .select('*, factories(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileCheck className="w-5 h-5" style={{ color: '#D4A843' }} /> Factory Audits
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{(audits ?? []).length} audits</p>
        </div>
        {canManage(ctx.role) && (
          <Link href="/compliance/audits/new">
            <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }}><Plus className="w-4 h-4" /> Schedule Audit</Button>
          </Link>
        )}
      </div>
      {(audits ?? []).length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><p className="text-sm text-muted-foreground">No audits yet</p></div>
      ) : (
        <div className="space-y-3">
          {(audits ?? []).map((a: any) => {
            const sCfg = AUDIT_STATUS_CONFIG[a.status as AuditStatus] || AUDIT_STATUS_CONFIG.scheduled
            const rCfg = a.overall_rating ? RATING_CONFIG[a.overall_rating as AuditRating] : null
            return (
              <Link key={a.id} href={`/compliance/audits/${a.id}`} className="block">
                <div className="bg-card rounded-xl border border-border p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{a.factories?.name || 'Unknown'}</span>
                      <Badge variant="secondary" className="text-[10px] capitalize">{AUDIT_TYPE_CONFIG[a.audit_type as AuditType]?.label || a.audit_type}</Badge>
                      <Badge style={{ backgroundColor: sCfg.bg, color: sCfg.color }} className="text-[10px]">{sCfg.label}</Badge>
                      {rCfg && <span className="font-bold text-sm" style={{ color: rCfg.color }}>{rCfg.label}</span>}
                    </div>
                    {a.score != null && <span className="text-sm font-mono font-semibold">{a.score}%</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.audit_standard || ''} {a.audit_date ? `· ${a.audit_date}` : ''} {a.next_audit_date ? `· Next: ${a.next_audit_date}` : ''}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
