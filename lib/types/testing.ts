export type TestCategory = 'physical' | 'chemical' | 'colorfastness' | 'performance'
export type TestRequestStatus = 'draft' | 'submitted_to_lab' | 'in_testing' | 'results_received' | 'pass' | 'fail' | 'conditional_pass' | 'retest_required' | 'cancelled'
export type TestResult = 'pass' | 'fail' | 'pending' | 'not_applicable'

export const TEST_CATEGORY_CONFIG: Record<TestCategory, { label: string; color: string; bg: string }> = {
  physical: { label: 'Physical', color: '#1565C0', bg: '#E3F2FD' },
  chemical: { label: 'Chemical', color: '#CC0000', bg: '#FFEBEE' },
  colorfastness: { label: 'Colorfastness', color: '#7B1FA2', bg: '#F3E5F5' },
  performance: { label: 'Performance', color: '#2E7D32', bg: '#E8F5E9' },
}

export const TEST_STATUS_CONFIG: Record<TestRequestStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#666', bg: '#f0f0f0' },
  submitted_to_lab: { label: 'Submitted to Lab', color: '#1565C0', bg: '#E3F2FD' },
  in_testing: { label: 'In Testing', color: '#D4A843', bg: '#FFF8E1' },
  results_received: { label: 'Results Received', color: '#7B1FA2', bg: '#F3E5F5' },
  pass: { label: 'Pass', color: '#2E7D32', bg: '#E8F5E9' },
  fail: { label: 'Fail', color: '#CC0000', bg: '#FFEBEE' },
  conditional_pass: { label: 'Conditional Pass', color: '#E65100', bg: '#FFF3E0' },
  retest_required: { label: 'Retest Required', color: '#CC0000', bg: '#FFEBEE' },
  cancelled: { label: 'Cancelled', color: '#999', bg: '#f5f5f5' },
}

export interface TestRequest {
  id: string
  project_id: string | null
  production_order_id: string | null
  sample_request_id: string | null
  request_number: string
  lab_id: string | null
  test_category: TestCategory
  fabric_type: string | null
  fabric_composition: string | null
  color: string | null
  sample_size: string | null
  buyer_standard: string | null
  status: TestRequestStatus
  submitted_date: string | null
  expected_result_date: string | null
  actual_result_date: string | null
  overall_result: string | null
  report_url: string | null
  notes: string | null
  created_at: string
  lab_partners?: { lab_name: string } | null
  projects?: { name: string } | null
}

export interface TestResultRow {
  id: string
  test_request_id: string
  test_name: string
  test_method: string | null
  test_parameter: string | null
  required_value: string | null
  actual_value: string | null
  unit: string | null
  result: TestResult
  grade: string | null
  remarks: string | null
}

export interface LabPartner {
  id: string
  lab_name: string
  lab_code: string | null
  accreditation: string | null
  country: string | null
  city: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  specializations: string[] | null
  turnaround_days: number
  is_active: boolean
}

export interface TestTemplateDef {
  test_name: string
  test_method: string
  test_parameter: string
  required_value: string
  unit: string
}

export const DEFAULT_TEST_TEMPLATES: { name: string; category: TestCategory; buyer_standard: string; tests: TestTemplateDef[] }[] = [
  {
    name: 'Physical — Standard', category: 'physical', buyer_standard: 'General',
    tests: [
      { test_name: 'Tensile Strength', test_method: 'ASTM D5034', test_parameter: 'Breaking force', required_value: 'Min 25 lbs', unit: 'lbs' },
      { test_name: 'Tear Strength', test_method: 'ASTM D1424', test_parameter: 'Tear force', required_value: 'Min 2 lbs', unit: 'lbs' },
      { test_name: 'Pilling Resistance', test_method: 'ASTM D4970', test_parameter: 'Pilling grade', required_value: 'Grade 3-4 min', unit: 'grade' },
      { test_name: 'Shrinkage (Wash)', test_method: 'AATCC 135', test_parameter: 'Dimensional change', required_value: 'Max ±3%', unit: '%' },
      { test_name: 'Seam Slippage', test_method: 'ASTM D434', test_parameter: 'Slippage', required_value: 'Min 6mm', unit: 'mm' },
      { test_name: 'Abrasion Resistance', test_method: 'ASTM D4966', test_parameter: 'Cycles', required_value: 'Min 20,000', unit: 'cycles' },
    ],
  },
  {
    name: 'Chemical — Safety', category: 'chemical', buyer_standard: 'General',
    tests: [
      { test_name: 'pH Value', test_method: 'ISO 3071', test_parameter: 'pH', required_value: '4.0 - 7.5', unit: 'pH' },
      { test_name: 'Formaldehyde', test_method: 'ISO 14184-1', test_parameter: 'Content', required_value: 'Max 75 ppm', unit: 'ppm' },
      { test_name: 'AZO Dyes', test_method: 'EN 14362', test_parameter: 'Banned amines', required_value: 'Not detected', unit: '' },
      { test_name: 'Heavy Metals (Lead)', test_method: 'CPSC-CH-E1001', test_parameter: 'Lead content', required_value: 'Max 90 ppm', unit: 'ppm' },
      { test_name: 'Nickel Release', test_method: 'EN 1811', test_parameter: 'Release rate', required_value: 'Max 0.5', unit: 'µg/cm²/week' },
      { test_name: 'PFAS', test_method: 'EPA Method 533', test_parameter: 'Content', required_value: 'Not detected', unit: '' },
    ],
  },
  {
    name: 'Colorfastness — Standard', category: 'colorfastness', buyer_standard: 'General',
    tests: [
      { test_name: 'Colorfastness to Washing', test_method: 'AATCC 61', test_parameter: 'Color change', required_value: 'Grade 4 min', unit: 'grade' },
      { test_name: 'Colorfastness to Light', test_method: 'AATCC 16', test_parameter: 'Color change', required_value: 'Grade 4 min', unit: 'grade' },
      { test_name: 'Colorfastness to Rubbing (Dry)', test_method: 'AATCC 8', test_parameter: 'Staining', required_value: 'Grade 4 min', unit: 'grade' },
      { test_name: 'Colorfastness to Rubbing (Wet)', test_method: 'AATCC 8', test_parameter: 'Staining', required_value: 'Grade 3 min', unit: 'grade' },
      { test_name: 'Colorfastness to Water', test_method: 'AATCC 107', test_parameter: 'Color change', required_value: 'Grade 4 min', unit: 'grade' },
      { test_name: 'Colorfastness to Perspiration', test_method: 'AATCC 15', test_parameter: 'Color change', required_value: 'Grade 3-4 min', unit: 'grade' },
    ],
  },
  {
    name: 'Performance — Outerwear', category: 'performance', buyer_standard: 'General',
    tests: [
      { test_name: 'Water Resistance', test_method: 'AATCC 127', test_parameter: 'Hydrostatic head', required_value: 'Min 60 cm', unit: 'cm' },
      { test_name: 'Breathability (MVTR)', test_method: 'ASTM E96', test_parameter: 'Moisture vapor', required_value: 'Min 5000', unit: 'g/m²/24h' },
      { test_name: 'Down Fill Power', test_method: 'IDFB', test_parameter: 'Fill power', required_value: 'Min 550', unit: 'cuin' },
      { test_name: 'Insulation (CLO)', test_method: 'ASTM F1868', test_parameter: 'Thermal resistance', required_value: 'Per spec', unit: 'CLO' },
    ],
  },
]
