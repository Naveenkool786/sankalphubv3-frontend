/**
 * Category-specific production stages for planning module.
 */

export const PRODUCTION_STAGES: Record<string, string[]> = {
  garments: ['Cutting', 'Sewing', 'Finishing', 'Packing', 'QC'],
  footwear: ['Upper Preparation', 'Sole Making', 'Lasting', 'Finishing', 'QC'],
  gloves: ['Cutting', 'Sewing', 'Turning', 'Inspection', 'Packing'],
  headwear: ['Cutting', 'Forming', 'Assembly', 'Finishing', 'QC'],
  accessories: ['Component Prep', 'Assembly', 'Finishing', 'QC', 'Packing'],
}

export const STAGE_COLORS: Record<string, string> = {
  Cutting: '#3B82F6',
  Sewing: '#8B5CF6',
  Finishing: '#F59E0B',
  Packing: '#10B981',
  QC: '#EF4444',
  'Upper Preparation': '#3B82F6',
  'Sole Making': '#6366F1',
  Lasting: '#D97706',
  Turning: '#0EA5E9',
  Inspection: '#EF4444',
  Forming: '#8B5CF6',
  Assembly: '#6366F1',
  'Component Prep': '#3B82F6',
}

export function getStagesForCategory(category: string): string[] {
  return PRODUCTION_STAGES[category.toLowerCase()] || PRODUCTION_STAGES.garments
}
