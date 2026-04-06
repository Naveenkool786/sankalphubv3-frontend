import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { ClipboardCheck } from 'lucide-react'
import Link from 'next/link'

export default async function AuditTemplatesPage() {
  const supabase = createAdminClient()

  const { data: templates } = await (supabase.from('audit_templates') as any)
    .select('*, audit_template_sections(id, section_name, audit_template_checkpoints(id))')
    .eq('is_active', true)
    .order('template_name')

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" style={{ color: '#D4A843' }} /> Audit Templates
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{(templates ?? []).length} templates</p>
      </div>

      <div className="space-y-3">
        {(templates ?? []).map((t: any) => {
          const sectionCount = (t.audit_template_sections ?? []).length
          const checkpointCount = (t.audit_template_sections ?? []).reduce((s: number, sec: any) => s + (sec.audit_template_checkpoints ?? []).length, 0)
          return (
            <div key={t.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{t.template_name}</span>
                  <Badge variant="secondary" className="text-[10px]">{t.standard}</Badge>
                  <Badge variant="secondary" className="text-[10px]">v{t.version}</Badge>
                  {t.is_default && <Badge className="bg-[#D4A843] text-white text-[10px]">Default</Badge>}
                </div>
                <span className="text-xs text-muted-foreground">{sectionCount} sections · {checkpointCount} checkpoints</span>
              </div>
              {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(t.audit_template_sections ?? []).map((sec: any) => (
                  <span key={sec.id} className="px-2 py-0.5 bg-muted rounded text-[10px]">
                    {sec.section_name} ({(sec.audit_template_checkpoints ?? []).length})
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
