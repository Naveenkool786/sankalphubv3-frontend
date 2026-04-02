import * as XLSX from 'xlsx'

interface ProjectForExport {
  name: string
  season?: string | null
  product_category?: string | null
  product_type?: string | null
  factory_name?: string | null
  po_number?: string | null
  quantity?: number | null
  unit?: string | null
  country?: string | null
  buyer_brand?: string | null
  status?: string | null
  priority?: string | null
  aql_level?: string | null
  inspection_type?: string | null
  expected_delivery?: string | null
  deadline?: string | null
  inspection_date?: string | null
  shipment_date?: string | null
  sizes?: Record<string, string | number> | null
  notes?: string | null
}

export function exportProjectExcel(project: ProjectForExport): void {
  const wb = XLSX.utils.book_new()

  const details = [
    ['SankalpHub \u2014 Project Export'],
    ['Generated', new Date().toLocaleDateString('en-IN')],
    [],
    ['Field', 'Value'],
    ['Project Name', project.name],
    ['Season', project.season || ''],
    ['Category', project.product_category || ''],
    ['Product Type', project.product_type || ''],
    ['Factory', project.factory_name || ''],
    ['PO Number', project.po_number || ''],
    ['Quantity', project.quantity || 0],
    ['Unit', project.unit || 'pcs'],
    ['Country', project.country || ''],
    ['Buyer / Brand', project.buyer_brand || ''],
    ['Status', project.status || ''],
    ['Priority', project.priority || ''],
    ['AQL Level', project.aql_level || ''],
    ['Inspection Type', project.inspection_type || ''],
    ['Expected Delivery', project.expected_delivery || project.deadline || ''],
    ['Inspection Date', project.inspection_date || ''],
    ['Shipment Date', project.shipment_date || ''],
    ['Notes', project.notes || ''],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(details)
  ws1['!cols'] = [{ wch: 22 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Project Details')

  // Sizes sheet
  const sizes = project.sizes || {}
  const sizeEntries = Object.entries(sizes).filter(([, v]) => v && parseInt(String(v)) > 0)
  if (sizeEntries.length > 0) {
    const total = sizeEntries.reduce((s, [, v]) => s + parseInt(String(v)), 0)
    const sizeData = [
      ['Size', 'Quantity'],
      ...sizeEntries.map(([k, v]) => [k, parseInt(String(v))]),
      ['TOTAL', total],
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(sizeData)
    ws2['!cols'] = [{ wch: 10 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Size Breakdown')
  }

  XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '-')}-project.xlsx`)
}
