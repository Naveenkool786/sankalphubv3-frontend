/**
 * WRAP-Aligned Factory Audit Checkpoints
 * 35 checkpoints across 3 sections
 */

export interface AuditCheckpointDef {
  number: number
  section: 'employment' | 'health_safety' | 'management'
  wrap_principle: string
  description: string
}

export const AUDIT_CHECKPOINTS: AuditCheckpointDef[] = [
  // Section 1: Employment Practices (1-8)
  { number: 1, section: 'employment', wrap_principle: 'Prohibition of Forced Labor', description: 'No evidence of forced, bonded, or involuntary labor; workers free to leave' },
  { number: 2, section: 'employment', wrap_principle: 'Prohibition of Child Labor', description: 'Age verification documents on file; no workers below legal minimum age' },
  { number: 3, section: 'employment', wrap_principle: 'Prohibition of Harassment/Abuse', description: 'Anti-harassment policy posted; grievance mechanism accessible to all workers' },
  { number: 4, section: 'employment', wrap_principle: 'Compensation & Benefits', description: 'Wages meet or exceed legal minimum; overtime paid at premium rates' },
  { number: 5, section: 'employment', wrap_principle: 'Hours of Work', description: 'Working hours within legal limits; overtime voluntary and documented' },
  { number: 6, section: 'employment', wrap_principle: 'Prohibition of Discrimination', description: 'No discrimination in hiring, pay, or promotion based on protected characteristics' },
  { number: 7, section: 'employment', wrap_principle: 'Freedom of Association', description: 'Workers free to form or join unions; no retaliation for collective activity' },
  { number: 8, section: 'employment', wrap_principle: 'Employment Documentation', description: 'Employment contracts on file; terms clearly communicated to workers' },

  // Section 2: Health, Safety & Environment (9-24)
  { number: 9, section: 'health_safety', wrap_principle: 'H&S Management System', description: 'Written health and safety policy; designated safety officer or committee' },
  { number: 10, section: 'health_safety', wrap_principle: 'Fire Safety', description: 'Fire extinguishers serviced and accessible; emergency exits clearly marked and unblocked' },
  { number: 11, section: 'health_safety', wrap_principle: 'First Aid & Medical', description: 'First aid kits stocked and accessible; trained first aiders on each shift' },
  { number: 12, section: 'health_safety', wrap_principle: 'Machine Safety & Guarding', description: 'All machines have proper guards; lockout/tagout procedures in place' },
  { number: 13, section: 'health_safety', wrap_principle: 'Chemical/Hazardous Materials', description: 'MSDS available for all chemicals; proper storage, labeling, and handling procedures' },
  { number: 14, section: 'health_safety', wrap_principle: 'PPE Provision', description: 'Appropriate PPE provided free of charge; workers trained on correct usage' },
  { number: 15, section: 'health_safety', wrap_principle: 'Environmental Compliance', description: 'Environmental permits current; emissions and discharge within legal limits' },
  { number: 16, section: 'health_safety', wrap_principle: 'Waste Management', description: 'Waste segregated and disposed of properly; recycling program in place where applicable' },
  { number: 17, section: 'health_safety', wrap_principle: 'Dormitory Conditions', description: 'Dormitories meet space, ventilation, and sanitation standards (if applicable)' },
  { number: 18, section: 'health_safety', wrap_principle: 'Emergency Evacuation', description: 'Evacuation plan posted; drills conducted at least twice per year' },
  { number: 19, section: 'health_safety', wrap_principle: 'Electrical Safety', description: 'Electrical installations inspected; no exposed wiring or overloaded circuits' },
  { number: 20, section: 'health_safety', wrap_principle: 'Structural Integrity', description: 'Building structure sound; load-bearing capacity not exceeded on any floor' },
  { number: 21, section: 'health_safety', wrap_principle: 'Ventilation & Lighting', description: 'Adequate natural or mechanical ventilation; lighting meets standards for work type' },
  { number: 22, section: 'health_safety', wrap_principle: 'Canteen/Dining Hygiene', description: 'Food preparation area clean; drinking water tested and safe' },
  { number: 23, section: 'health_safety', wrap_principle: 'Restricted Substances', description: 'REACH/CPSIA compliance documented; restricted substance testing records on file' },
  { number: 24, section: 'health_safety', wrap_principle: 'Product Safety Testing', description: 'Product safety test reports available; testing conducted by accredited labs' },

  // Section 3: Management & Security (25-35)
  { number: 25, section: 'management', wrap_principle: 'Legal Compliance', description: 'Business licenses and permits current; facility registered with relevant authorities' },
  { number: 26, section: 'management', wrap_principle: 'Sub-contracting Controls', description: 'Sub-contractors identified and approved; no unauthorized sub-contracting' },
  { number: 27, section: 'management', wrap_principle: 'Security Procedures', description: 'C-TPAT or equivalent security protocols; cargo integrity procedures in place' },
  { number: 28, section: 'management', wrap_principle: 'Management Systems', description: 'Corrective action tracking system functional; previous audit findings addressed' },
  { number: 29, section: 'management', wrap_principle: 'Record Keeping', description: 'Payroll, attendance, and production records maintained for required retention period' },
  { number: 30, section: 'management', wrap_principle: 'Worker Grievance Mechanism', description: 'Anonymous grievance channel available; complaints investigated and resolved timely' },
  { number: 31, section: 'management', wrap_principle: 'Anti-corruption Policy', description: 'Anti-bribery/corruption policy documented and communicated to management' },
  { number: 32, section: 'management', wrap_principle: 'Supply Chain Transparency', description: 'Supplier list maintained; key material sources documented and traceable' },
  { number: 33, section: 'management', wrap_principle: 'Water Management', description: 'Water usage monitored; water treatment for effluent where required' },
  { number: 34, section: 'management', wrap_principle: 'Energy Efficiency', description: 'Energy consumption tracked; efficiency improvement initiatives documented' },
  { number: 35, section: 'management', wrap_principle: 'Worker Training Records', description: 'Training matrix maintained; safety and skills training records on file for all workers' },
]

export const SECTION_LABELS: Record<string, string> = {
  employment: 'Employment Practices',
  health_safety: 'Health, Safety & Environment',
  management: 'Management & Security',
}

export type AuditRating = 'G' | 'Y' | 'R' | 'NA' | null

export interface AuditCheckpointResponse {
  checkpoint_number: number
  section: string
  wrap_principle: string
  description: string
  rating: AuditRating
  notes: string
  corrective_action: string
  corrective_deadline: string
}

export function calculateAuditScore(responses: AuditCheckpointResponse[]): {
  score: number
  gCount: number
  yCount: number
  rCount: number
  naCount: number
  result: 'approved' | 'conditional' | 'failed'
} {
  const rated = responses.filter(r => r.rating && r.rating !== 'NA')
  const gCount = rated.filter(r => r.rating === 'G').length
  const yCount = rated.filter(r => r.rating === 'Y').length
  const rCount = rated.filter(r => r.rating === 'R').length
  const naCount = responses.filter(r => r.rating === 'NA').length
  const score = rated.length > 0 ? Math.round((gCount + yCount) / rated.length * 100) : 0
  const result = score >= 85 ? 'approved' : score >= 70 ? 'conditional' : 'failed'
  return { score, gCount, yCount, rCount, naCount, result }
}
