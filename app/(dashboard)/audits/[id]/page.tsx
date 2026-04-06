import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { AuditFormClient } from './_components/AuditFormClient'

export default async function AuditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: audit }, { data: ratings }, { data: sections }] = await Promise.all([
    (supabase.from('factory_audits_v2') as any).select('*, factories(name, city, country), audit_templates(template_name, standard)').eq('id', id).single(),
    (supabase.from('audit_ratings') as any).select('*').eq('audit_id', id).order('item_number'),
    (supabase.from('audit_template_sections') as any).select('*, audit_template_checkpoints(*)').order('section_order'),
  ])

  if (!audit) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Audit not found.</div>

  // Filter sections to this template
  const templateSections = (sections ?? []).filter((s: any) => s.template_id === audit.template_id)
    .map((s: any) => ({ ...s, audit_template_checkpoints: (s.audit_template_checkpoints ?? []).sort((a: any, b: any) => a.item_number - b.item_number) }))

  return (
    <div className="p-4 lg:p-6">
      <AuditFormClient
        audit={audit}
        ratings={(ratings ?? []) as any[]}
        sections={templateSections as any[]}
        canManage={canManage(ctx.role)}
      />
    </div>
  )
}
