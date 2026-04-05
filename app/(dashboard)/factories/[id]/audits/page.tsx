import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/getUserContext'
import Link from 'next/link'
import { ArrowLeft, Plus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default async function FactoryAuditsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : await createClient()

  const [{ data: factory }, { data: audits }] = await Promise.all([
    (supabase.from('factories') as any).select('id, name').eq('id', id).eq('org_id', ctx.orgId).single(),
    (supabase.from('factory_audits') as any).select('*').eq('factory_id', id).eq('org_id', ctx.orgId).order('audit_date', { ascending: false }),
  ])

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Link href={`/factories/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to {factory?.name || 'Factory'}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Audit History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{factory?.name} — WRAP compliance audits</p>
        </div>
        <Link href={`/factories/${id}/audits/new`}>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New WRAP Audit
          </Button>
        </Link>
      </div>

      {(!audits || audits.length === 0) ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No audits yet</p>
          <p className="text-xs text-muted-foreground mt-1">Start a WRAP compliance audit to assess this factory.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(audits as any[]).map((audit: any) => (
            <div key={audit.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{
                background: audit.result === 'approved' ? '#E1F5EE' : audit.result === 'conditional' ? '#FAEEDA' : '#FCEBEB',
                color: audit.result === 'approved' ? '#085041' : audit.result === 'conditional' ? '#633806' : '#791F1F',
              }}>
                {audit.total_score}%
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{new Date(audit.audit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <Badge variant="secondary" className={cn('text-[10px]',
                    audit.result === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                    audit.result === 'conditional' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-red-500/10 text-red-600'
                  )}>
                    {audit.result === 'approved' ? 'Approved' : audit.result === 'conditional' ? 'Conditional' : 'Failed'}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">{audit.audit_type || 'initial'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {audit.auditor_name || 'Unknown auditor'} · G:{audit.g_count ?? 0} Y:{audit.y_count ?? 0} R:{audit.r_count ?? 0} N/A:{audit.na_count ?? 0}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
