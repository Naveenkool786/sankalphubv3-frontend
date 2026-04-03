/**
 * Inspection checklist templates per product category.
 * Each category has sections with numbered items.
 */

export interface ChecklistItem {
  number: number
  question: string
}

export interface ChecklistSection {
  section: string
  items: ChecklistItem[]
}

const GARMENTS: ChecklistSection[] = [
  {
    section: 'Workmanship & construction',
    items: [
      { number: 1, question: 'Seams are straight and even throughout' },
      { number: 2, question: 'No loose or exposed threads' },
      { number: 3, question: 'Zipper operates smoothly without snagging' },
      { number: 4, question: 'Buttons are securely attached with no movement' },
      { number: 5, question: 'Lining is properly sewn and aligned' },
      { number: 6, question: 'Pocket openings are correctly positioned and secure' },
      { number: 7, question: 'Collar/cuff shape is correct and symmetrical' },
      { number: 8, question: 'Overall appearance matches approved sample' },
    ],
  },
  {
    section: 'Measurements & sizing',
    items: [
      { number: 1, question: 'Chest measurement within \u00B11cm tolerance' },
      { number: 2, question: 'Length measurement within \u00B11cm tolerance' },
      { number: 3, question: 'Sleeve length within \u00B10.5cm tolerance' },
      { number: 4, question: 'Shoulder width within \u00B10.5cm tolerance' },
      { number: 5, question: 'Waist/hip measurement within tolerance' },
      { number: 6, question: 'Size label matches actual measurements' },
    ],
  },
  {
    section: 'Fabric & material quality',
    items: [
      { number: 1, question: 'Fabric colour matches approved standard' },
      { number: 2, question: 'No shade variation between panels' },
      { number: 3, question: 'No fabric defects \u2014 holes, pulls, snags' },
      { number: 4, question: 'Fabric weight and hand feel matches spec' },
      { number: 5, question: 'Fabric construction is correct' },
    ],
  },
  {
    section: 'Trims, labels & packaging',
    items: [
      { number: 1, question: 'All labels present \u2014 size, care, brand, country of origin' },
      { number: 2, question: 'Label placement correct per spec' },
      { number: 3, question: 'Packaging matches approved standard' },
      { number: 4, question: 'Barcode/price tag present and scannable' },
    ],
  },
  {
    section: 'Safety & compliance',
    items: [
      { number: 1, question: 'No sharp edges or points that could cause injury' },
      { number: 2, question: 'Care instructions meet destination market requirements' },
      { number: 3, question: 'No prohibited substances \u2014 lead, azo dyes etc.' },
    ],
  },
]

const FOOTWEAR: ChecklistSection[] = [
  {
    section: 'Construction',
    items: [
      { number: 1, question: 'Upper stitching is even and secure' },
      { number: 2, question: 'Sole bonding is complete with no gaps' },
      { number: 3, question: 'Toe box shape matches approved sample' },
      { number: 4, question: 'Heel height is correct and stable' },
      { number: 5, question: 'Insole is properly fitted and cushioned' },
      { number: 6, question: 'Outsole grip pattern is correct' },
    ],
  },
  {
    section: 'Materials',
    items: [
      { number: 1, question: 'Upper material matches spec' },
      { number: 2, question: 'Lining material is correct' },
      { number: 3, question: 'Insole cushioning meets spec' },
      { number: 4, question: 'Outsole material is durable' },
    ],
  },
  {
    section: 'Sizing',
    items: [
      { number: 1, question: 'Length is correct per size chart' },
      { number: 2, question: 'Width is correct per size chart' },
      { number: 3, question: 'Left/right pair is matched' },
      { number: 4, question: 'Size marking is correct and visible' },
    ],
  },
  {
    section: 'Trims & packaging',
    items: [
      { number: 1, question: 'Laces/buckles are secure and functional' },
      { number: 2, question: 'All labels present and correct' },
      { number: 3, question: 'Packaging matches approved standard' },
    ],
  },
]

const GLOVES: ChecklistSection[] = [
  {
    section: 'Construction',
    items: [
      { number: 1, question: 'Palm seam strength is adequate' },
      { number: 2, question: 'Finger seam quality is consistent' },
      { number: 3, question: 'Cuff stitching is secure' },
      { number: 4, question: 'Lining attachment is proper' },
    ],
  },
  {
    section: 'Materials',
    items: [
      { number: 1, question: 'Outer material matches spec' },
      { number: 2, question: 'Grip surface is correct' },
      { number: 3, question: 'Padding is adequate (if applicable)' },
    ],
  },
  {
    section: 'Sizing',
    items: [
      { number: 1, question: 'Hand length is correct' },
      { number: 2, question: 'Finger length is correct' },
      { number: 3, question: 'Cuff width is correct' },
      { number: 4, question: 'Size label matches actual measurements' },
    ],
  },
]

const HEADWEAR: ChecklistSection[] = [
  {
    section: 'Construction',
    items: [
      { number: 1, question: 'Crown shape matches approved sample' },
      { number: 2, question: 'Brim/peak stability is correct' },
      { number: 3, question: 'Sweatband is properly attached' },
      { number: 4, question: 'Closure mechanism functions correctly' },
    ],
  },
  {
    section: 'Materials',
    items: [
      { number: 1, question: 'Fabric quality matches spec' },
      { number: 2, question: 'Stiffening materials are correct' },
      { number: 3, question: 'Embroidery/print quality is acceptable' },
    ],
  },
  {
    section: 'Sizing',
    items: [
      { number: 1, question: 'Head circumference is correct' },
      { number: 2, question: 'Depth is correct' },
      { number: 3, question: 'Adjustability range is adequate' },
    ],
  },
]

const ACCESSORIES: ChecklistSection[] = [
  {
    section: 'Construction',
    items: [
      { number: 1, question: 'Seam strength is adequate' },
      { number: 2, question: 'Hardware attachment is secure' },
      { number: 3, question: 'Lining quality is acceptable' },
      { number: 4, question: 'Closure function is correct' },
    ],
  },
  {
    section: 'Materials',
    items: [
      { number: 1, question: 'Material quality matches spec' },
      { number: 2, question: 'Hardware finish is correct' },
      { number: 3, question: 'Colour fastness is acceptable' },
    ],
  },
  {
    section: 'Sizing',
    items: [
      { number: 1, question: 'Dimensions match spec' },
      { number: 2, question: 'Hardware sizing is correct' },
    ],
  },
]

const CHECKLISTS: Record<string, ChecklistSection[]> = {
  garments: GARMENTS,
  footwear: FOOTWEAR,
  gloves: GLOVES,
  headwear: HEADWEAR,
  accessories: ACCESSORIES,
}

export function getChecklistForCategory(category: string): ChecklistSection[] {
  return CHECKLISTS[category.toLowerCase()] || GARMENTS
}

export function getTotalItemCount(sections: ChecklistSection[]): number {
  return sections.reduce((sum, s) => sum + s.items.length, 0)
}
