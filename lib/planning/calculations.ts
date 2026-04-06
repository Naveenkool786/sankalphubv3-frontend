/**
 * Planning module calculation helpers.
 */

/** Count working days between two dates (excludes weekends) */
export function getWorkingDays(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  let count = 0
  const d = new Date(s)
  while (d <= e) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count || 1
}

/** Calculate daily target from total quantity and working days */
export function calculateDailyTarget(totalQuantity: number, startDate: string, endDate: string): number {
  const days = getWorkingDays(startDate, endDate)
  return Math.ceil(totalQuantity / days)
}

/** Calculate efficiency percentage */
export function calculateEfficiency(actual: number, target: number): number {
  if (target <= 0) return 0
  return Math.round((actual / target) * 100)
}

/** Get efficiency color */
export function getEfficiencyColor(pct: number): string {
  if (pct >= 100) return '#16a34a'
  if (pct >= 80) return '#d97706'
  return '#dc2626'
}

/** Days between two dates */
export function daysBetween(start: string, end: string): number {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (86400000))
}
