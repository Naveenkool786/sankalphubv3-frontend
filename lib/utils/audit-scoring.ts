import type { AuditRatingValue, AuditVerdict } from '@/lib/types/audits'

export interface SectionScore {
  sectionId: string
  sectionName: string
  score: number
  greenCount: number
  yellowCount: number
  redCount: number
  naCount: number
  total: number
}

export interface AuditScoreResult {
  greenCount: number
  yellowCount: number
  redCount: number
  naCount: number
  totalItems: number
  applicableItems: number
  itemsOK: number
  actionsRequired: number
  overallScore: number
  verdict: AuditVerdict
  ratedCount: number
  sectionScores: SectionScore[]
}

export function calculateAuditScore(
  ratings: Record<string, AuditRatingValue | null>,
  sectionMap?: Record<string, { sectionId: string; sectionName: string }>
): AuditScoreResult {
  const values = Object.values(ratings)
  const rated = values.filter(v => v !== null) as AuditRatingValue[]

  const greenCount = rated.filter(r => r === 'G').length
  const yellowCount = rated.filter(r => r === 'Y').length
  const redCount = rated.filter(r => r === 'R').length
  const naCount = rated.filter(r => r === 'NA').length
  const totalItems = values.length
  const applicableItems = greenCount + yellowCount + redCount
  const itemsOK = greenCount + yellowCount
  const actionsRequired = redCount
  const overallScore = applicableItems > 0 ? Math.round((itemsOK / applicableItems) * 100 * 100) / 100 : 0

  let verdict: AuditVerdict
  if (overallScore >= 90) verdict = 'passed'
  else if (overallScore >= 75) verdict = 'conditional'
  else if (overallScore >= 50) verdict = 'warning'
  else verdict = 'failed'

  // Section scores
  const sectionScores: SectionScore[] = []
  if (sectionMap) {
    const sections: Record<string, { name: string; ratings: (AuditRatingValue | null)[] }> = {}
    for (const [cpId, rating] of Object.entries(ratings)) {
      const sec = sectionMap[cpId]
      if (!sec) continue
      if (!sections[sec.sectionId]) sections[sec.sectionId] = { name: sec.sectionName, ratings: [] }
      sections[sec.sectionId].ratings.push(rating)
    }
    for (const [sectionId, sec] of Object.entries(sections)) {
      const r = sec.ratings.filter(v => v !== null) as AuditRatingValue[]
      const g = r.filter(v => v === 'G').length
      const y = r.filter(v => v === 'Y').length
      const red = r.filter(v => v === 'R').length
      const na = r.filter(v => v === 'NA').length
      const applicable = g + y + red
      sectionScores.push({
        sectionId,
        sectionName: sec.name,
        score: applicable > 0 ? Math.round(((g + y) / applicable) * 100 * 100) / 100 : 0,
        greenCount: g, yellowCount: y, redCount: red, naCount: na, total: sec.ratings.length,
      })
    }
  }

  return {
    greenCount, yellowCount, redCount, naCount,
    totalItems, applicableItems, itemsOK, actionsRequired,
    overallScore, verdict, ratedCount: rated.length, sectionScores,
  }
}
