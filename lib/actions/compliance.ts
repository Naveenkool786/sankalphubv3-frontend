'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { MARKETING_STAGES } from '@/lib/types/compliance'

// ─── Seed Regulations ───

export async function seedRegulations(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { count } = await (supabase.from('compliance_requirements') as any).select('id', { count: 'exact', head: true })
    if (count && count > 0) return { success: true }

    const regulations = [
      { regulation_name: 'CPSIA', regulation_code: 'CPSIA', region: 'US', category: 'safety', description: "Consumer Product Safety Improvement Act — lead, phthalates limits for children's products", testing_required: true, certification_required: true },
      { regulation_name: 'CPSC 16 CFR 1610', regulation_code: 'CFR1610', region: 'US', category: 'safety', description: 'Flammability of clothing textiles', testing_required: true, certification_required: false },
      { regulation_name: 'FTC Textile Rules', regulation_code: 'FTC-TEXTILE', region: 'US', category: 'labeling', description: 'Fiber content, country of origin, care labeling (16 CFR 303)', testing_required: false, certification_required: false },
      { regulation_name: 'California Prop 65', regulation_code: 'PROP65', region: 'US', category: 'chemical', description: 'Warning requirements for chemicals known to cause cancer or reproductive harm', testing_required: true, certification_required: false },
      { regulation_name: 'Lacey Act', regulation_code: 'LACEY', region: 'US', category: 'trade', description: 'Prohibition of illegally sourced plant-based fibers', testing_required: false, certification_required: true },
      { regulation_name: 'TSCA', regulation_code: 'TSCA', region: 'US', category: 'chemical', description: 'Toxic Substances Control Act — PFAS restrictions', testing_required: true, certification_required: false },
      { regulation_name: 'REACH', regulation_code: 'REACH', region: 'EU', category: 'chemical', description: 'Registration, Evaluation, Authorisation and Restriction of Chemicals', testing_required: true, certification_required: true },
      { regulation_name: 'EU Textile Regulation 1007/2011', regulation_code: 'EU-1007', region: 'EU', category: 'labeling', description: 'Textile fibre names and related labelling', testing_required: false, certification_required: false },
      { regulation_name: 'EU ESPR', regulation_code: 'ESPR', region: 'EU', category: 'environmental', description: 'Ecodesign for Sustainable Products Regulation — digital product passport', testing_required: false, certification_required: true },
      { regulation_name: 'EU CSDDD', regulation_code: 'CSDDD', region: 'EU', category: 'social', description: 'Corporate Sustainability Due Diligence Directive', testing_required: false, certification_required: false },
      { regulation_name: 'EU Green Claims Directive', regulation_code: 'GREEN-CLAIMS', region: 'EU', category: 'labeling', description: 'Substantiation requirements for environmental claims', testing_required: false, certification_required: false },
      { regulation_name: 'OEKO-TEX Standard 100', regulation_code: 'OEKO-100', region: 'global', category: 'chemical', description: 'Testing for harmful substances in textiles', testing_required: true, certification_required: true },
    ]

    await (supabase.from('compliance_requirements') as any).insert(regulations)
    revalidatePath('/compliance/regulations')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── Factory Audits ───

export async function createFactoryAudit(data: {
  factory_id: string
  audit_type: string
  audit_standard?: string
  auditor_name?: string
  auditor_organization?: string
  audit_date?: string
  next_audit_date?: string
  notes?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { data: audit, error } = await (supabase.from('factory_audits') as any).insert({
      factory_id: data.factory_id,
      audit_type: data.audit_type,
      audit_standard: data.audit_standard || null,
      auditor_name: data.auditor_name || null,
      auditor_organization: data.auditor_organization || null,
      audit_date: data.audit_date || null,
      next_audit_date: data.next_audit_date || null,
      status: 'scheduled',
      notes: data.notes || null,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/compliance/audits')
    return { success: true, id: audit.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateAudit(auditId: string, data: {
  status?: string
  overall_rating?: string
  score?: number
  findings_count?: number
  critical_findings?: number
  major_findings?: number
  minor_findings?: number
  corrective_action_deadline?: string
  certificate_expiry?: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (data.status) updateData.status = data.status
    if (data.overall_rating) updateData.overall_rating = data.overall_rating
    if (data.score !== undefined) updateData.score = data.score
    if (data.findings_count !== undefined) updateData.findings_count = data.findings_count
    if (data.critical_findings !== undefined) updateData.critical_findings = data.critical_findings
    if (data.major_findings !== undefined) updateData.major_findings = data.major_findings
    if (data.minor_findings !== undefined) updateData.minor_findings = data.minor_findings
    if (data.corrective_action_deadline) updateData.corrective_action_deadline = data.corrective_action_deadline
    if (data.certificate_expiry) updateData.certificate_expiry = data.certificate_expiry
    if (data.notes !== undefined) updateData.notes = data.notes || null

    const { error } = await (supabase.from('factory_audits') as any).update(updateData).eq('id', auditId)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/compliance/audits/${auditId}`)
    revalidatePath('/compliance/audits')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── Product Certifications ───

export async function createCertification(data: {
  project_id?: string
  certification_name: string
  certification_body?: string
  certificate_number?: string
  applied_date?: string
  expiry_date?: string
  scope?: string
  cost?: number
  currency?: string
  notes?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { data: cert, error } = await (supabase.from('product_certifications') as any).insert({
      project_id: data.project_id || null,
      certification_name: data.certification_name,
      certification_body: data.certification_body || null,
      certificate_number: data.certificate_number || null,
      status: 'pending',
      applied_date: data.applied_date || null,
      expiry_date: data.expiry_date || null,
      scope: data.scope || null,
      cost: data.cost || null,
      currency: data.currency || 'USD',
      notes: data.notes || null,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/compliance/certifications')
    return { success: true, id: cert.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateCertificationStatus(certId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() }
    if (status === 'approved') updateData.approved_date = new Date().toISOString().split('T')[0]

    const { error } = await (supabase.from('product_certifications') as any).update(updateData).eq('id', certId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/compliance/certifications')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── Sustainability Metrics ───

export async function saveSustainabilityMetrics(data: {
  factory_id: string
  metric_period: string
  water_usage_liters?: number
  energy_usage_kwh?: number
  renewable_energy_pct?: number
  waste_generated_kg?: number
  waste_recycled_pct?: number
  carbon_emissions_kg?: number
  total_workers?: number
  female_workers_pct?: number
  living_wage_compliance?: boolean
  average_overtime_hours?: number
  workplace_incidents?: number
  sustainable_material_pct?: number
  recycled_content_pct?: number
  organic_content_pct?: number
  esg_score?: number
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await (supabase.from('sustainability_metrics') as any).insert({
      factory_id: data.factory_id,
      metric_period: data.metric_period,
      water_usage_liters: data.water_usage_liters ?? null,
      energy_usage_kwh: data.energy_usage_kwh ?? null,
      renewable_energy_pct: data.renewable_energy_pct ?? null,
      waste_generated_kg: data.waste_generated_kg ?? null,
      waste_recycled_pct: data.waste_recycled_pct ?? null,
      carbon_emissions_kg: data.carbon_emissions_kg ?? null,
      total_workers: data.total_workers ?? null,
      female_workers_pct: data.female_workers_pct ?? null,
      living_wage_compliance: data.living_wage_compliance ?? null,
      average_overtime_hours: data.average_overtime_hours ?? null,
      workplace_incidents: data.workplace_incidents ?? null,
      sustainable_material_pct: data.sustainable_material_pct ?? null,
      recycled_content_pct: data.recycled_content_pct ?? null,
      organic_content_pct: data.organic_content_pct ?? null,
      esg_score: data.esg_score ?? null,
      notes: data.notes || null,
      created_by: ctx.userId,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/compliance/sustainability')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── Marketing Milestones ───

export async function createMarketingMilestones(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()

    // Check if already exist
    const { count } = await (supabase.from('marketing_milestones') as any).select('id', { count: 'exact', head: true }).eq('project_id', projectId)
    if (count && count > 0) return { success: true }

    const milestones = MARKETING_STAGES.map(s => ({
      project_id: projectId,
      milestone_stage: s.stage,
      milestone_order: s.order,
      deliverables: s.deliverables,
      status: 'pending',
      created_by: ctx.userId,
    }))

    await (supabase.from('marketing_milestones') as any).insert(milestones)
    revalidatePath('/compliance/marketing')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateMarketingMilestone(milestoneId: string, data: {
  status?: string
  planned_date?: string
  actual_date?: string
  assigned_to?: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    const supabase = createAdminClient()

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (data.status) updateData.status = data.status
    if (data.planned_date !== undefined) updateData.planned_date = data.planned_date || null
    if (data.actual_date !== undefined) updateData.actual_date = data.actual_date || null
    if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to || null
    if (data.notes !== undefined) updateData.notes = data.notes || null

    if (data.status === 'completed' && !data.actual_date) {
      updateData.actual_date = new Date().toISOString().split('T')[0]
    }

    const { error } = await (supabase.from('marketing_milestones') as any).update(updateData).eq('id', milestoneId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/compliance/marketing')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}
