'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Ship, Plane, Package, Truck, TrainFront, Loader2, Save, CheckCircle2, Clock, Plus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  SHIPPING_MODE_CONFIG, SHIPMENT_STATUS_CONFIG, DOCUMENT_TYPE_CONFIG, DOCUMENT_STATUS_CONFIG,
  REQUIRED_DOCS, type Shipment, type ShipmentMilestone, type PackingListItem, type ShippingDocument,
  type ShippingMode, type DocumentType,
} from '@/lib/types/logistics'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/types/costing'
import {
  updateShipmentStatus, updateMilestone, addPackingListItem, deletePackingListItem,
  addShippingDocument, updateDocumentStatus, updateShipmentCosts,
} from '@/lib/actions/logistics'

interface Props {
  shipment: Shipment; milestones: ShipmentMilestone[]
  packingItems: PackingListItem[]; documents: ShippingDocument[]; canManage: boolean
}

const MODE_ICONS: Record<string, React.ReactNode> = {
  sea_fcl: <Ship className="w-5 h-5" />,
  sea_lcl: <Ship className="w-5 h-5" />,
  air: <Plane className="w-5 h-5" />,
  courier: <Package className="w-5 h-5" />,
  rail: <TrainFront className="w-5 h-5" />,
  road: <Truck className="w-5 h-5" />,
}

const NEXT_STATUS: Record<string, { label: string; next: string }> = {
  booking: { label: 'Confirm Booking', next: 'booked' },
  booked: { label: 'At Origin Port', next: 'at_origin_port' },
  at_origin_port: { label: 'Customs (Origin)', next: 'customs_clearance_origin' },
  customs_clearance_origin: { label: 'In Transit', next: 'in_transit' },
  in_transit: { label: 'At Destination', next: 'at_destination_port' },
  at_destination_port: { label: 'Customs (Dest)', next: 'customs_clearance_destination' },
  customs_clearance_destination: { label: 'Last Mile', next: 'last_mile' },
  last_mile: { label: 'Delivered', next: 'delivered' },
}

export function ShipmentDetailClient({ shipment, milestones, packingItems, documents, canManage }: Props) {
  const modeCfg = SHIPPING_MODE_CONFIG[shipment.shipping_mode] || SHIPPING_MODE_CONFIG.courier
  const statusCfg = SHIPMENT_STATUS_CONFIG[shipment.status] || SHIPMENT_STATUS_CONFIG.booking
  const [statusLoading, setStatusLoading] = useState('')

  // Tracking
  const completedMs = milestones.filter(m => m.status === 'completed').length
  const progress = milestones.length > 0 ? Math.round((completedMs / milestones.length) * 100) : 0

  // Packing form
  const [showPackingForm, setShowPackingForm] = useState(false)
  const [packingForm, setPackingForm] = useState({ carton_number: '', style_number: '', color: '', total_pcs: '', gross_weight_kg: '', carton_dimensions: '', s: '', m: '', l: '', xl: '', xxl: '' })
  const [savingPacking, setSavingPacking] = useState(false)

  // Costs
  const [costForm, setCostForm] = useState({
    freight_cost: String(shipment.freight_cost || ''),
    freight_currency: shipment.freight_currency || 'USD',
    insurance_cost: String(shipment.insurance_cost || ''),
    customs_duty: String(shipment.customs_duty || ''),
    other_charges: String(shipment.other_charges || ''),
  })
  const [savingCosts, setSavingCosts] = useState(false)

  const handleStatus = async (status: string) => {
    setStatusLoading(status)
    const result = await updateShipmentStatus(shipment.id, status)
    setStatusLoading('')
    if (result.success) toast.success('Status updated')
    else toast.error('Failed', { description: result.error })
  }

  const handleMilestoneComplete = async (m: ShipmentMilestone) => {
    const result = await updateMilestone(m.id, shipment.id, {
      status: 'completed',
      actual_date: new Date().toISOString(),
    })
    if (result.success) toast.success(`${m.milestone_name} completed`)
    else toast.error('Failed', { description: result.error })
  }

  const handleAddPacking = async () => {
    if (!packingForm.carton_number || !packingForm.total_pcs) { toast.error('Carton # and total pcs required'); return }
    setSavingPacking(true)
    const sizeBreakdown: Record<string, number> = {}
    if (packingForm.s) sizeBreakdown['S'] = parseInt(packingForm.s)
    if (packingForm.m) sizeBreakdown['M'] = parseInt(packingForm.m)
    if (packingForm.l) sizeBreakdown['L'] = parseInt(packingForm.l)
    if (packingForm.xl) sizeBreakdown['XL'] = parseInt(packingForm.xl)
    if (packingForm.xxl) sizeBreakdown['XXL'] = parseInt(packingForm.xxl)

    const result = await addPackingListItem(shipment.id, {
      packing_list_number: `PL-${shipment.shipment_number}`,
      carton_number: packingForm.carton_number,
      style_number: packingForm.style_number || undefined,
      color: packingForm.color || undefined,
      size_breakdown: Object.keys(sizeBreakdown).length > 0 ? sizeBreakdown : undefined,
      total_pcs: parseInt(packingForm.total_pcs),
      gross_weight_kg: parseFloat(packingForm.gross_weight_kg) || undefined,
      carton_dimensions: packingForm.carton_dimensions || undefined,
    })
    setSavingPacking(false)
    if (result.success) {
      toast.success('Carton added')
      setPackingForm({ carton_number: '', style_number: '', color: '', total_pcs: '', gross_weight_kg: '', carton_dimensions: '', s: '', m: '', l: '', xl: '', xxl: '' })
      setShowPackingForm(false)
    } else toast.error('Failed', { description: result.error })
  }

  const handleAddDocument = async (docType: DocumentType) => {
    const result = await addShippingDocument(shipment.id, { document_type: docType })
    if (result.success) toast.success('Document entry created')
    else toast.error('Failed', { description: result.error })
  }

  const handleSaveCosts = async () => {
    setSavingCosts(true)
    const result = await updateShipmentCosts(shipment.id, {
      freight_cost: parseFloat(costForm.freight_cost) || 0,
      freight_currency: costForm.freight_currency,
      insurance_cost: parseFloat(costForm.insurance_cost) || 0,
      customs_duty: parseFloat(costForm.customs_duty) || 0,
      other_charges: parseFloat(costForm.other_charges) || 0,
    })
    setSavingCosts(false)
    if (result.success) toast.success('Costs saved')
    else toast.error('Failed', { description: result.error })
  }

  const totalPacking = packingItems.reduce((s, p) => s + p.total_pcs, 0)
  const totalWeight = packingItems.reduce((s, p) => s + (p.gross_weight_kg || 0), 0)
  const requiredDocs = REQUIRED_DOCS[shipment.shipping_mode as ShippingMode] || []
  const sym = getCurrencySymbol(costForm.freight_currency)
  const totalCost = (parseFloat(costForm.freight_cost) || 0) + (parseFloat(costForm.insurance_cost) || 0) + (parseFloat(costForm.customs_duty) || 0) + (parseFloat(costForm.other_charges) || 0)
  const nextAction = NEXT_STATUS[shipment.status]

  return (
    <div>
      <Link href="/logistics" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Logistics
      </Link>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: modeCfg.bg, color: modeCfg.color }}>
              {MODE_ICONS[shipment.shipping_mode]}
            </div>
            <h1 className="text-xl font-bold text-foreground">{shipment.shipment_number}</h1>
            <Badge style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</Badge>
            {shipment.incoterm && <Badge variant="secondary" className="text-[10px]">{shipment.incoterm}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {[shipment.carrier_name, shipment.projects?.name, shipment.container_number].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Route card */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground">Origin</p>
            <p className="text-sm font-semibold">{shipment.origin_port || '—'}</p>
            <p className="text-[10px] text-muted-foreground">{shipment.origin_country || ''}</p>
            <p className="text-[10px] font-mono mt-1">ETD: {shipment.estimated_departure || '—'}</p>
          </div>
          <div className="flex items-center gap-2 px-4">
            <div className="h-0.5 w-12 bg-border" />
            <div style={{ color: modeCfg.color }}>{MODE_ICONS[shipment.shipping_mode]}</div>
            <div className="h-0.5 w-12 bg-border" />
          </div>
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground">Destination</p>
            <p className="text-sm font-semibold">{shipment.destination_port || '—'}</p>
            <p className="text-[10px] text-muted-foreground">{shipment.destination_country || ''}</p>
            <p className="text-[10px] font-mono mt-1">ETA: {shipment.estimated_arrival || '—'}</p>
          </div>
        </div>
      </div>

      {/* Status action */}
      {canManage && nextAction && shipment.status !== 'cancelled' && shipment.status !== 'delivered' && (
        <div className="flex gap-2 mb-4">
          <Button size="sm" className="text-xs gap-1" onClick={() => handleStatus(nextAction.next)} disabled={!!statusLoading} style={{ backgroundColor: '#D4A843' }}>
            {statusLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null} {nextAction.label}
          </Button>
          <Button size="sm" variant="outline" className="text-xs text-red-600" onClick={() => handleStatus('cancelled')} disabled={!!statusLoading}>Cancel</Button>
        </div>
      )}

      <Tabs defaultValue="tracking">
        <TabsList className="bg-muted/50 mb-4">
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="packing">Packing ({packingItems.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        {/* Tracking Tab */}
        <TabsContent value="tracking">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Tracking ({completedMs}/{milestones.length})</h3>
              <span className="text-xs font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mb-6">
              <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#D4A843' }} />
            </div>
            <div className="space-y-0">
              {milestones.map((m, i) => {
                const isCompleted = m.status === 'completed'
                const isCurrent = !isCompleted && (i === 0 || milestones[i - 1]?.status === 'completed')
                return (
                  <div key={m.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2',
                        isCompleted ? 'bg-green-500 border-green-500 text-white' : isCurrent ? 'border-[#D4A843] bg-[#D4A843]/10' : 'border-border bg-background'
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isCurrent ? <Clock className="w-3 h-3 text-[#D4A843]" /> : <span className="text-[9px] text-muted-foreground">{m.milestone_order}</span>}
                      </div>
                      {i < milestones.length - 1 && <div className={cn('w-0.5 flex-1 min-h-[24px]', isCompleted ? 'bg-green-400' : 'bg-border')} />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <span className={cn('text-xs font-medium', isCompleted ? 'text-green-700' : isCurrent ? 'text-foreground' : 'text-muted-foreground')}>{m.milestone_name}</span>
                        {canManage && isCurrent && (
                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleMilestoneComplete(m)}>
                            Complete
                          </Button>
                        )}
                      </div>
                      {m.actual_date && <p className="text-[10px] text-muted-foreground">{new Date(m.actual_date).toLocaleDateString()}</p>}
                      {m.location && <p className="text-[10px] text-muted-foreground">{m.location}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* Packing Tab */}
        <TabsContent value="packing">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Packing List — {totalPacking} pcs · {totalWeight.toFixed(1)} kg</h3>
              {canManage && (
                <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => setShowPackingForm(!showPackingForm)}>
                  <Plus className="w-3 h-3" /> Add Carton
                </Button>
              )}
            </div>
            {showPackingForm && (
              <div className="p-4 border-b border-border bg-muted/20 space-y-2">
                <div className="grid grid-cols-6 gap-2">
                  <div><label className="text-[10px] text-muted-foreground">Carton # *</label><Input className="h-8 text-xs" value={packingForm.carton_number} onChange={e => setPackingForm(f => ({ ...f, carton_number: e.target.value }))} placeholder="CTN-001" /></div>
                  <div><label className="text-[10px] text-muted-foreground">Style #</label><Input className="h-8 text-xs" value={packingForm.style_number} onChange={e => setPackingForm(f => ({ ...f, style_number: e.target.value }))} /></div>
                  <div><label className="text-[10px] text-muted-foreground">Color</label><Input className="h-8 text-xs" value={packingForm.color} onChange={e => setPackingForm(f => ({ ...f, color: e.target.value }))} /></div>
                  <div><label className="text-[10px] text-muted-foreground">Total Pcs *</label><Input type="number" className="h-8 text-xs" value={packingForm.total_pcs} onChange={e => setPackingForm(f => ({ ...f, total_pcs: e.target.value }))} /></div>
                  <div><label className="text-[10px] text-muted-foreground">Weight (kg)</label><Input type="number" step="0.01" className="h-8 text-xs" value={packingForm.gross_weight_kg} onChange={e => setPackingForm(f => ({ ...f, gross_weight_kg: e.target.value }))} /></div>
                  <div><label className="text-[10px] text-muted-foreground">Dimensions</label><Input className="h-8 text-xs" value={packingForm.carton_dimensions} onChange={e => setPackingForm(f => ({ ...f, carton_dimensions: e.target.value }))} placeholder="60x40x30" /></div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex gap-1">
                    {['s', 'm', 'l', 'xl', 'xxl'].map(sz => (
                      <div key={sz} className="w-14">
                        <label className="text-[10px] text-muted-foreground uppercase">{sz}</label>
                        <Input type="number" className="h-8 text-xs" value={(packingForm as any)[sz]} onChange={e => setPackingForm(f => ({ ...f, [sz]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <Button size="sm" className="h-8 text-xs gap-1" onClick={handleAddPacking} disabled={savingPacking}>
                    {savingPacking ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Add
                  </Button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Carton #</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Style</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Color</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">S</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">M</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">L</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">XL</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">XXL</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Total</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Weight</th>
                    {canManage && <th className="px-3 py-2.5 w-8"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {packingItems.map(p => {
                    const sb = p.size_breakdown || {}
                    return (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{p.carton_number}</td>
                        <td className="px-3 py-2 text-muted-foreground">{p.style_number || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{p.color || '—'}</td>
                        <td className="px-3 py-2 text-center">{sb['S'] || '—'}</td>
                        <td className="px-3 py-2 text-center">{sb['M'] || '—'}</td>
                        <td className="px-3 py-2 text-center">{sb['L'] || '—'}</td>
                        <td className="px-3 py-2 text-center">{sb['XL'] || '—'}</td>
                        <td className="px-3 py-2 text-center">{sb['XXL'] || '—'}</td>
                        <td className="px-3 py-2 text-right font-semibold">{p.total_pcs}</td>
                        <td className="px-3 py-2 text-right">{p.gross_weight_kg ? `${p.gross_weight_kg} kg` : '—'}</td>
                        {canManage && (
                          <td className="px-3 py-2">
                            <button onClick={() => deletePackingListItem(p.id, shipment.id).then(r => r.success ? toast.success('Removed') : toast.error('Failed'))} className="p-1 hover:bg-red-50 rounded">
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
                {packingItems.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/30">
                      <td colSpan={8} className="px-3 py-2 text-right font-semibold">Total</td>
                      <td className="px-3 py-2 text-right font-bold">{totalPacking}</td>
                      <td className="px-3 py-2 text-right font-bold">{totalWeight.toFixed(1)} kg</td>
                      {canManage && <td />}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {packingItems.length === 0 && !showPackingForm && (
              <div className="p-8 text-center text-sm text-muted-foreground">No packing items yet</div>
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-4">Required Documents</h3>
            <div className="space-y-2">
              {requiredDocs.map(docType => {
                const doc = documents.find(d => d.document_type === docType)
                const dtCfg = DOCUMENT_TYPE_CONFIG[docType]
                const dsCfg = doc ? (DOCUMENT_STATUS_CONFIG[doc.status as keyof typeof DOCUMENT_STATUS_CONFIG] || DOCUMENT_STATUS_CONFIG.pending) : null
                return (
                  <div key={docType} className="flex items-center justify-between py-2.5 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', doc ? (doc.status === 'verified' ? 'bg-green-500' : doc.status === 'uploaded' ? 'bg-blue-500' : doc.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300') : 'bg-gray-300')} />
                      <span className="text-xs font-medium">{dtCfg.label}</span>
                      {doc && dsCfg && <Badge style={{ backgroundColor: dsCfg.bg, color: dsCfg.color }} className="text-[9px]">{dsCfg.label}</Badge>}
                    </div>
                    {canManage && !doc && (
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 gap-1" onClick={() => handleAddDocument(docType)}>
                        <Upload className="w-3 h-3" /> Add
                      </Button>
                    )}
                    {canManage && doc && doc.status === 'uploaded' && (
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 gap-1 text-green-600" onClick={() => updateDocumentStatus(doc.id, shipment.id, 'verified').then(r => r.success ? toast.success('Verified') : toast.error('Failed'))}>
                        <CheckCircle2 className="w-3 h-3" /> Verify
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
            {documents.filter(d => !requiredDocs.includes(d.document_type as DocumentType)).length > 0 && (
              <>
                <h4 className="text-xs font-semibold text-muted-foreground mt-4 mb-2">Additional Documents</h4>
                {documents.filter(d => !requiredDocs.includes(d.document_type as DocumentType)).map(doc => {
                  const dtCfg = DOCUMENT_TYPE_CONFIG[doc.document_type as DocumentType] || { label: doc.document_type }
                  return (
                    <div key={doc.id} className="flex items-center gap-2 py-1.5 text-xs">
                      <span>{dtCfg.label}</span>
                      {doc.document_number && <Badge variant="secondary" className="text-[9px]">{doc.document_number}</Badge>}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs">
          <div className="bg-card rounded-xl border border-border p-5 max-w-md">
            <h3 className="text-sm font-semibold mb-4">Logistics Costs</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Currency</label>
                <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm mt-1" value={costForm.freight_currency} onChange={e => setCostForm(f => ({ ...f, freight_currency: e.target.value }))}>
                  {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground">Freight Cost</label>
                <Input type="number" step="0.01" className="h-9 text-sm" value={costForm.freight_cost} onChange={e => setCostForm(f => ({ ...f, freight_cost: e.target.value }))} /></div>
              <div><label className="text-xs text-muted-foreground">Insurance Cost</label>
                <Input type="number" step="0.01" className="h-9 text-sm" value={costForm.insurance_cost} onChange={e => setCostForm(f => ({ ...f, insurance_cost: e.target.value }))} /></div>
              <div><label className="text-xs text-muted-foreground">Customs Duty</label>
                <Input type="number" step="0.01" className="h-9 text-sm" value={costForm.customs_duty} onChange={e => setCostForm(f => ({ ...f, customs_duty: e.target.value }))} /></div>
              <div><label className="text-xs text-muted-foreground">Other Charges</label>
                <Input type="number" step="0.01" className="h-9 text-sm" value={costForm.other_charges} onChange={e => setCostForm(f => ({ ...f, other_charges: e.target.value }))} /></div>
              <div className="bg-muted/30 rounded-lg p-3 flex justify-between text-xs">
                <span className="font-semibold">Total Logistics Cost</span>
                <span className="font-mono font-bold">{sym}{totalCost.toFixed(2)}</span>
              </div>
              {canManage && (
                <Button size="sm" className="gap-1.5" onClick={handleSaveCosts} disabled={savingCosts} style={{ backgroundColor: '#D4A843' }}>
                  {savingCosts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Costs
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
