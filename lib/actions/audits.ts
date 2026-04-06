'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'

const RW_SECTIONS = [
  {
    order: 1, name: 'Social Responsibility / Legal & Compliance', shortName: 'Legal & Social', maxPoints: 25,
    checkpoints: [
      { item: 1, text: 'Ethical Sourcing: Verify compliance with ethical sourcing standards and policies.' },
      { item: 2, text: 'Supplier Code of Conduct: Assess adherence to the supplier code of conduct.' },
      { item: 3, text: "Community Relations: Evaluate the factory's relationship with the local community." },
      { item: 4, text: 'Business Licenses and Permits: Verify all necessary licenses, permits, and registrations are current.' },
      { item: 5, text: 'Labor Laws Adherence: Check compliance with labor laws, including minimum wage, overtime, working hours, and benefits.' },
      { item: 6, text: 'Health and Safety Regulations: Assess adherence to occupational health and safety regulations.' },
      { item: 7, text: 'Environmental Compliance: Verify compliance with environmental regulations, waste disposal, and pollution control.' },
    ],
  },
  {
    order: 2, name: 'Production Processes & Quality', shortName: 'Production & Quality', maxPoints: 20,
    conditionalNote: 'Is SPC (Statistical Process Control) required at this stage? If "no", mark items 8-10 as "N/A".',
    checkpoints: [
      { item: 8, text: 'Production Planning and Control: Assess production planning, scheduling, and control systems.', conditional: true, group: 'spc' },
      { item: 9, text: 'Quality Management System: Evaluate the implementation and effectiveness of the quality management system.', conditional: true, group: 'spc' },
      { item: 10, text: 'Material Handling and Storage: Check material handling practices, storage conditions, and inventory control.', conditional: true, group: 'spc' },
      { item: 11, text: 'Sewing Equipment and Maintenance: Assess the condition and maintenance of sewing equipment.' },
      { item: 12, text: 'Product Quality: Evaluate product quality through inspection and sampling.' },
    ],
  },
  {
    order: 3, name: 'Workplace Environment & Safety / Labor Practices', shortName: 'Workplace & Labor', maxPoints: 45,
    checkpoints: [
      { item: 13, text: 'First Aid Facilities: Verify availability and adequacy of first aid equipment and trained personnel.' },
      { item: 14, text: 'Hygiene and Sanitation: Check for clean restrooms, drinking water, and overall hygiene practices.' },
      { item: 15, text: 'Building Structure: Evaluate building condition, fire safety equipment, emergency exits, and lighting.' },
      { item: 16, text: 'Workstation Ergonomics: Assess workstation setup, ventilation, and noise levels.' },
      { item: 17, text: 'Forced Labor and Child Labor: Verify absence of forced labor, child labor, and bonded labor.' },
      { item: 18, text: 'Wages and Benefits: Assess wage payment, overtime pay, and benefits provided to workers.' },
      { item: 19, text: 'Working Hours: Check compliance with working hour regulations and overtime limits.' },
      { item: 20, text: 'Disciplinary Practices: Evaluate fairness and transparency of disciplinary procedures.' },
      { item: 21, text: "Freedom of Association: Verify workers' rights to form unions and collective bargaining." },
    ],
  },
]

export async function seedAuditTemplates(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { count } = await (supabase.from('audit_templates') as any).select('id', { count: 'exact', head: true })
    if (count && count > 0) return { success: true }

    // Template 1: RefrigiWear v1.0
    const { data: rwTemplate } = await (supabase.from('audit_templates') as any).insert({
      template_name: 'RefrigiWear Factory Audit Form v1.0',
      standard: 'RW-v1.0',
      version: 1,
      description: '21-point factory audit with G/Y/R/NA scoring across Social Responsibility, Production Quality, and Workplace Safety.',
      is_default: true,
    }).select().single()

    if (!rwTemplate) return { success: false, error: 'Failed to create template' }

    for (const sec of RW_SECTIONS) {
      const { data: section } = await (supabase.from('audit_template_sections') as any).insert({
        template_id: rwTemplate.id,
        section_order: sec.order,
        section_name: sec.name,
        short_name: sec.shortName,
        max_points: sec.maxPoints,
        conditional_note: (sec as any).conditionalNote || null,
      }).select().single()

      if (section) {
        const checkpoints = sec.checkpoints.map(cp => ({
          section_id: section.id,
          item_number: cp.item,
          checkpoint_text: cp.text,
          is_conditional: (cp as any).conditional || false,
          condition_group: (cp as any).group || null,
        }))
        await (supabase.from('audit_template_checkpoints') as any).insert(checkpoints)
      }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

function generateAuditNumber(): string {
  const date = format(new Date(), 'yyyyMMdd')
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `FA-${date}-${random}`
}

export async function createAuditV2(data: {
  factory_id: string
  template_id: string
  audit_date: string
  audit_type?: string
  auditor_name: string
  auditor_organization?: string
  department?: string
  plant_audited?: string
  shift_audited?: string
  attendees?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()

    // Get template checkpoints
    const { data: sections } = await (supabase.from('audit_template_sections') as any)
      .select('id, section_order, section_name')
      .eq('template_id', data.template_id)
      .order('section_order')

    const sectionIds = (sections ?? []).map((s: any) => s.id)
    const { data: checkpoints } = await (supabase.from('audit_template_checkpoints') as any)
      .select('id, section_id, item_number')
      .in('section_id', sectionIds)
      .order('item_number')

    const totalItems = (checkpoints ?? []).length

    const { data: audit, error } = await (supabase.from('factory_audits_v2') as any).insert({
      factory_id: data.factory_id,
      template_id: data.template_id,
      audit_number: generateAuditNumber(),
      audit_date: data.audit_date,
      audit_type: data.audit_type || 'initial',
      auditor_name: data.auditor_name,
      auditor_organization: data.auditor_organization || null,
      department: data.department || null,
      plant_audited: data.plant_audited || null,
      shift_audited: data.shift_audited || null,
      attendees: data.attendees || null,
      status: 'draft',
      total_items: totalItems,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }

    // Create rating rows
    if (checkpoints && checkpoints.length > 0) {
      const ratings = checkpoints.map((cp: any) => ({
        audit_id: audit.id,
        checkpoint_id: cp.id,
        section_id: cp.section_id,
        item_number: cp.item_number,
        rating: null,
        corrective_action_status: 'open',
        rated_by: ctx.userId,
      }))
      await (supabase.from('audit_ratings') as any).insert(ratings)
    }

    revalidatePath('/audits')
    return { success: true, id: audit.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateAuditRating(ratingId: string, auditId: string, data: {
  rating: string
  notes?: string
  corrective_action?: string
  corrective_action_deadline?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    const supabase = createAdminClient()

    const updateData: Record<string, any> = {
      rating: data.rating,
      rated_by: ctx.userId,
      rated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.corrective_action !== undefined) updateData.corrective_action = data.corrective_action || null
    if (data.corrective_action_deadline) updateData.corrective_action_deadline = data.corrective_action_deadline

    const { error } = await (supabase.from('audit_ratings') as any).update(updateData).eq('id', ratingId)
    if (error) return { success: false, error: error.message }

    // Recalc scores
    await recalcAuditScores(supabase, auditId)

    revalidatePath(`/audits/${auditId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function submitAudit(auditId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()

    // Check all items rated and red items have notes
    const { data: ratings } = await (supabase.from('audit_ratings') as any).select('rating, notes').eq('audit_id', auditId)
    const unrated = (ratings ?? []).filter((r: any) => !r.rating)
    if (unrated.length > 0) return { success: false, error: `${unrated.length} items not yet rated` }

    const redNoNotes = (ratings ?? []).filter((r: any) => r.rating === 'R' && !r.notes)
    if (redNoNotes.length > 0) return { success: false, error: `${redNoNotes.length} Red items missing notes` }

    const { error } = await (supabase.from('factory_audits_v2') as any)
      .update({ status: 'submitted', updated_at: new Date().toISOString() })
      .eq('id', auditId)

    if (error) return { success: false, error: error.message }
    revalidatePath(`/audits/${auditId}`)
    revalidatePath('/audits')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateAuditStatus(auditId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await (supabase.from('factory_audits_v2') as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', auditId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/audits')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

async function recalcAuditScores(supabase: any, auditId: string) {
  const { data: ratings } = await (supabase.from('audit_ratings') as any)
    .select('rating').eq('audit_id', auditId)

  const rated = (ratings ?? []).filter((r: any) => r.rating)
  const g = rated.filter((r: any) => r.rating === 'G').length
  const y = rated.filter((r: any) => r.rating === 'Y').length
  const r = rated.filter((r: any) => r.rating === 'R').length
  const na = rated.filter((rr: any) => rr.rating === 'NA').length
  const applicable = g + y + r
  const itemsOK = g + y
  const score = applicable > 0 ? Math.round((itemsOK / applicable) * 100 * 100) / 100 : 0

  let verdict: string
  if (score >= 90) verdict = 'passed'
  else if (score >= 75) verdict = 'conditional'
  else if (score >= 50) verdict = 'warning'
  else verdict = 'failed'

  await (supabase.from('factory_audits_v2') as any).update({
    green_count: g, yellow_count: y, red_count: r, na_count: na,
    applicable_items: applicable, items_ok: itemsOK, actions_required: r,
    overall_score: score, verdict,
    updated_at: new Date().toISOString(),
  }).eq('id', auditId)
}
