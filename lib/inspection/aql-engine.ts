/**
 * AQL Engine — ISO 2859-1 sample size lookup + accept/reject limits
 */

/** Sample size code letters for Normal Level II */
export function getSampleSize(lotSize: number, level = 'normal_2'): number {
  if (level === 'normal_2') {
    if (lotSize <= 8) return 2
    if (lotSize <= 15) return 3
    if (lotSize <= 25) return 5
    if (lotSize <= 50) return 8
    if (lotSize <= 90) return 13
    if (lotSize <= 150) return 20
    if (lotSize <= 280) return 32
    if (lotSize <= 500) return 50
    if (lotSize <= 1200) return 80
    if (lotSize <= 3200) return 125
    if (lotSize <= 10000) return 200
    if (lotSize <= 35000) return 315
    if (lotSize <= 150000) return 500
    return 800
  }
  if (level === 'tightened_1') {
    if (lotSize <= 150) return 20
    if (lotSize <= 500) return 50
    if (lotSize <= 1200) return 80
    if (lotSize <= 3200) return 125
    if (lotSize <= 10000) return 200
    return 315
  }
  if (level === 'reduced_3') {
    if (lotSize <= 150) return 8
    if (lotSize <= 500) return 13
    if (lotSize <= 1200) return 20
    if (lotSize <= 3200) return 32
    if (lotSize <= 10000) return 50
    return 80
  }
  return 125
}

/** Accept/reject numbers for a given sample size and AQL level */
export function getAQLLimits(sampleSize: number, aqlLevel = '2.5') {
  if (aqlLevel === '2.5') {
    if (sampleSize <= 13) return { major: { accept: 1, reject: 2 }, minor: { accept: 2, reject: 3 } }
    if (sampleSize <= 20) return { major: { accept: 1, reject: 2 }, minor: { accept: 3, reject: 4 } }
    if (sampleSize <= 32) return { major: { accept: 2, reject: 3 }, minor: { accept: 5, reject: 6 } }
    if (sampleSize <= 50) return { major: { accept: 3, reject: 4 }, minor: { accept: 7, reject: 8 } }
    if (sampleSize <= 80) return { major: { accept: 5, reject: 6 }, minor: { accept: 10, reject: 11 } }
    if (sampleSize <= 125) return { major: { accept: 7, reject: 8 }, minor: { accept: 14, reject: 15 } }
    if (sampleSize <= 200) return { major: { accept: 10, reject: 11 }, minor: { accept: 21, reject: 22 } }
    if (sampleSize <= 315) return { major: { accept: 14, reject: 15 }, minor: { accept: 21, reject: 22 } }
    return { major: { accept: 21, reject: 22 }, minor: { accept: 21, reject: 22 } }
  }
  if (aqlLevel === '1.0') {
    if (sampleSize <= 50) return { major: { accept: 1, reject: 2 }, minor: { accept: 3, reject: 4 } }
    if (sampleSize <= 80) return { major: { accept: 2, reject: 3 }, minor: { accept: 5, reject: 6 } }
    if (sampleSize <= 125) return { major: { accept: 3, reject: 4 }, minor: { accept: 7, reject: 8 } }
    if (sampleSize <= 200) return { major: { accept: 5, reject: 6 }, minor: { accept: 10, reject: 11 } }
    return { major: { accept: 7, reject: 8 }, minor: { accept: 14, reject: 15 } }
  }
  if (aqlLevel === '4.0') {
    if (sampleSize <= 50) return { major: { accept: 5, reject: 6 }, minor: { accept: 10, reject: 11 } }
    if (sampleSize <= 80) return { major: { accept: 7, reject: 8 }, minor: { accept: 14, reject: 15 } }
    if (sampleSize <= 125) return { major: { accept: 10, reject: 11 }, minor: { accept: 21, reject: 22 } }
    return { major: { accept: 14, reject: 15 }, minor: { accept: 21, reject: 22 } }
  }
  return { major: { accept: 7, reject: 8 }, minor: { accept: 14, reject: 15 } }
}

/** Calculate overall AQL result */
export function calculateAQL(
  criticalFound: number,
  majorFound: number,
  minorFound: number,
  sampleSize: number,
  aqlLevel = '2.5',
) {
  const limits = getAQLLimits(sampleSize, aqlLevel)

  const criticalResult = criticalFound === 0 ? 'pass' : 'fail'
  const majorResult = majorFound <= limits.major.accept ? 'pass' : 'fail'
  const minorResult = minorFound <= limits.minor.accept ? 'pass' : 'fail'

  const overallResult =
    criticalResult === 'pass' && majorResult === 'pass' && minorResult === 'pass'
      ? 'pass'
      : 'fail'

  return { criticalResult, majorResult, minorResult, overallResult, limits }
}
