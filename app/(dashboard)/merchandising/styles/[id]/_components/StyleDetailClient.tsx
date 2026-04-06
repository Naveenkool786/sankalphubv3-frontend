'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  LIFECYCLE_CONFIG, LIFECYCLE_STAGES, LAB_DIP_CONFIG, ORDER_STATUS_CONFIG,
  type Style, type Colorway, type StyleBOM, type OrderBooking, type TechPack,
  type LifecycleStage, type LabDipStatus, type OrderBookingStatus,
} from '@/lib/types/merchandising'
import { updateStyleLifecycle, addColorway, addStyleBOMItem, createTechPack } from '@/lib/actions/merchandising'

interface Props {
  style: Style; colorways: Colorway[]; bom: StyleBOM[]
  orders: OrderBooking[]; techPacks: TechPack[]; canManage: boolean
}

const BOM_CATEGORIES = [
  'shell_fabric', 'lining_fabric', 'interlining', 'insulation', 'zipper', 'button',
  'snap', 'velcro', 'elastic', 'thread', 'label_main', 'label_care', 'hangtag',
  'poly_bag', 'embroidery', 'print', 'other_trim', 'other',
]

const BOM_COLORS: Record<string, string> = {
  shell_fabric: '#1565C0', lining_fabric: '#0277BD', interlining: '#00695C', insulation: '#2E7D32',
  zipper: '#D4A843', button: '#E65100', snap: '#7B1FA2', thread: '#616161',
  label_main: '#AD1457', label_care: '#C62828', hangtag: '#4E342E', poly_bag: '#9E9E9E',
  embroidery: '#F57F17', print: '#00838F', other_trim: '#558B2F', other: '#666',
}

export function StyleDetailClient({ style, colorways, bom, orders, techPacks, canManage }: Props) {
  const currentLC = LIFECYCLE_CONFIG[style.lifecycle_stage]
  const currentOrder = currentLC?.order ?? 0

  // Colorway form
  const [showColorForm, setShowColorForm] = useState(false)
  const [colorForm, setColorForm] = useState({ color_code: '', color_name: '', hex_value: '#000000', pantone_code: '' })
  const [savingColor, setSavingColor] = useState(false)

  // BOM form
  const [showBomForm, setShowBomForm] = useState(false)
  const [bomForm, setBomForm] = useState({ bom_category: 'shell_fabric', description: '', supplier: '', consumption: '', unit: 'yard', price: '', wastage: '0' })
  const [savingBom, setSavingBom] = useState(false)

  // Tech Pack
  const [creatingTP, setCreatingTP] = useState(false)

  const handleLifecycle = async (stage: string) => {
    const result = await updateStyleLifecycle(style.id, stage)
    if (result.success) toast.success(`Moved to ${LIFECYCLE_CONFIG[stage as LifecycleStage]?.label}`)
    else toast.error('Failed', { description: result.error })
  }

  const handleAddColor = async () => {
    if (!colorForm.color_code || !colorForm.color_name) { toast.error('Code and name required'); return }
    setSavingColor(true)
    const result = await addColorway(style.id, colorForm)
    setSavingColor(false)
    if (result.success) { toast.success('Colorway added'); setShowColorForm(false); setColorForm({ color_code: '', color_name: '', hex_value: '#000000', pantone_code: '' }) }
    else toast.error('Failed', { description: result.error })
  }

  const handleAddBom = async () => {
    if (!bomForm.description) { toast.error('Description required'); return }
    setSavingBom(true)
    const result = await addStyleBOMItem(style.id, {
      bom_category: bomForm.bom_category, description: bomForm.description,
      supplier: bomForm.supplier || undefined,
      consumption_per_unit: parseFloat(bomForm.consumption) || undefined,
      unit: bomForm.unit, unit_price: parseFloat(bomForm.price) || undefined,
      wastage_pct: parseFloat(bomForm.wastage) || undefined,
    })
    setSavingBom(false)
    if (result.success) { toast.success('BOM item added'); setShowBomForm(false); setBomForm({ bom_category: 'shell_fabric', description: '', supplier: '', consumption: '', unit: 'yard', price: '', wastage: '0' }) }
    else toast.error('Failed', { description: result.error })
  }

  const handleCreateTP = async () => {
    setCreatingTP(true)
    const result = await createTechPack(style.id, { base_size: 'M' })
    setCreatingTP(false)
    if (result.success) toast.success('Tech pack created')
    else toast.error('Failed', { description: result.error })
  }

  const totalBomCost = bom.reduce((s, b) => s + (b.total_cost_per_unit || 0), 0)
  const bomPieData = Object.entries(
    bom.reduce((acc: Record<string, number>, b) => { acc[b.bom_category] = (acc[b.bom_category] || 0) + (b.total_cost_per_unit || 0); return acc }, {})
  ).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: Math.round(v * 100) / 100, color: BOM_COLORS[k] || '#999' }))

  const totalOrderUnits = orders.reduce((s, o) => s + o.total_units, 0)

  return (
    <div>
      <Link href="/merchandising/styles" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Styles
      </Link>

      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-xl font-bold font-mono">{style.style_number}</h1>
          <span className="text-sm text-muted-foreground">{style.style_name}</span>
          {style.category && <Badge variant="secondary" className="text-[10px] capitalize">{style.category}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {[style.seasons?.season_code, style.factories?.name, style.buyer_brand, style.fabric_composition].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Lifecycle tracker */}
      <div className="bg-card rounded-xl border border-border p-3 mb-4 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-[600px]">
          {LIFECYCLE_STAGES.map((s, i) => {
            const cfg = LIFECYCLE_CONFIG[s]
            const isDone = cfg.order < currentOrder
            const isActive = s === style.lifecycle_stage
            return (
              <div key={s} className="flex items-center flex-1">
                <button
                  onClick={() => canManage && handleLifecycle(s)}
                  className={cn(
                    'flex-1 text-center py-1.5 rounded text-[9px] font-medium transition-colors',
                    isDone ? 'bg-green-100 text-green-700' : isActive ? 'ring-2 ring-[#D4A843] bg-[#D4A843]/10 text-[#D4A843]' : 'bg-muted/50 text-muted-foreground',
                    canManage && 'cursor-pointer hover:opacity-80'
                  )}
                >{cfg.label}</button>
                {i < LIFECYCLE_STAGES.length - 1 && <div className={cn('w-3 h-0.5 flex-shrink-0', isDone ? 'bg-green-400' : 'bg-border')} />}
              </div>
            )
          })}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/50 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="techpack">Tech Pack ({techPacks.length})</TabsTrigger>
          <TabsTrigger value="bom">BOM ({bom.length})</TabsTrigger>
          <TabsTrigger value="colors">Colors ({colorways.length})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">Details</h3>
              <div className="space-y-1.5 text-xs">
                {[['Category', style.category], ['Sub-category', style.sub_category], ['Gender', style.gender],
                  ['Fabric', style.fabric_composition], ['Construction', style.construction], ['Silhouette', style.silhouette],
                  ['Weight', style.weight_gsm ? `${style.weight_gsm} GSM` : null]].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="font-medium">{v || '—'}</span></div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">Pricing</h3>
              <div className="space-y-1.5 text-xs">
                {[['Wholesale', style.wholesale_price], ['Retail', style.retail_price], ['Target FOB', style.target_fob], ['Actual FOB', style.actual_fob]].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="font-mono font-medium">{v ? `$${Number(v).toFixed(2)}` : '—'}</span></div>
                ))}
                <div className="flex justify-between border-t border-border pt-1"><span className="text-muted-foreground">BOM Cost</span><span className="font-mono font-bold">${totalBomCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Orders</span><span className="font-bold">{totalOrderUnits.toLocaleString()} pcs</span></div>
              </div>
            </div>
          </div>
          {style.description && <div className="bg-card rounded-xl border border-border p-4 mt-3"><p className="text-xs">{style.description}</p></div>}
        </TabsContent>

        {/* Tech Pack */}
        <TabsContent value="techpack">
          {techPacks.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">No tech pack yet</p>
              {canManage && <Button size="sm" onClick={handleCreateTP} disabled={creatingTP} style={{ backgroundColor: '#D4A843' }}>
                {creatingTP ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Create Tech Pack
              </Button>}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-4">
              {techPacks.map(tp => (
                <div key={tp.id} className="space-y-2 text-xs">
                  <div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">v{tp.version}</Badge><Badge variant="secondary" className="text-[10px] capitalize">{tp.status}</Badge></div>
                  <div className="grid grid-cols-2 gap-2">
                    {[['Fit', tp.fit_type], ['Base Size', tp.base_size], ['Grading', tp.grading_rule]].map(([l, v]) => (
                      <div key={l as string} className="flex justify-between py-1 border-b border-border"><span className="text-muted-foreground">{l}</span><span className="font-medium">{v || '—'}</span></div>
                    ))}
                  </div>
                  {tp.design_details && <div><label className="text-[10px] text-muted-foreground">Design Details</label><p className="text-xs">{tp.design_details}</p></div>}
                  {tp.wash_care_instructions && <div><label className="text-[10px] text-muted-foreground">Wash Care</label><p className="text-xs">{tp.wash_care_instructions}</p></div>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* BOM */}
        <TabsContent value="bom">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">BOM — ${totalBomCost.toFixed(2)}/unit</h3>
                {canManage && <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => setShowBomForm(!showBomForm)}><Plus className="w-3 h-3" /> Add</Button>}
              </div>
              {showBomForm && (
                <div className="p-3 border-b border-border bg-muted/20 grid grid-cols-4 gap-2 items-end">
                  <div><label className="text-[10px] text-muted-foreground">Category</label>
                    <select className="w-full h-8 px-2 rounded border border-border bg-background text-xs" value={bomForm.bom_category} onChange={e => setBomForm(f => ({ ...f, bom_category: e.target.value }))}>
                      {BOM_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                    </select></div>
                  <div><label className="text-[10px] text-muted-foreground">Description</label><Input className="h-8 text-xs" value={bomForm.description} onChange={e => setBomForm(f => ({ ...f, description: e.target.value }))} /></div>
                  <div><label className="text-[10px] text-muted-foreground">Price</label><Input type="number" step="0.01" className="h-8 text-xs" value={bomForm.price} onChange={e => setBomForm(f => ({ ...f, price: e.target.value }))} /></div>
                  <Button size="sm" className="h-8 text-xs" onClick={handleAddBom} disabled={savingBom}>{savingBom ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}</Button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Supplier</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cost/Unit</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {bom.map(b => (
                      <tr key={b.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2 capitalize">{b.bom_category.replace(/_/g, ' ')}</td>
                        <td className="px-3 py-2 font-medium">{b.description}</td>
                        <td className="px-3 py-2 text-muted-foreground">{b.supplier || '—'}</td>
                        <td className="px-3 py-2 text-right font-mono">${(b.total_cost_per_unit || 0).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {bom.length > 0 && <tfoot><tr className="border-t-2 border-border bg-muted/30"><td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td><td className="px-3 py-2 text-right font-mono font-bold">${totalBomCost.toFixed(4)}</td></tr></tfoot>}
                </table>
              </div>
            </div>
            {bomPieData.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-xs font-semibold mb-2">Cost Breakdown</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={bomPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {bomPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `$${Number(v).toFixed(4)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Colors */}
        <TabsContent value="colors">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Colorways</h3>
              {canManage && <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => setShowColorForm(!showColorForm)}><Plus className="w-3 h-3" /> Add</Button>}
            </div>
            {showColorForm && (
              <div className="grid grid-cols-5 gap-2 mb-4 items-end">
                <div><label className="text-[10px] text-muted-foreground">Code *</label><Input className="h-8 text-xs" value={colorForm.color_code} onChange={e => setColorForm(f => ({ ...f, color_code: e.target.value }))} placeholder="BLK" /></div>
                <div><label className="text-[10px] text-muted-foreground">Name *</label><Input className="h-8 text-xs" value={colorForm.color_name} onChange={e => setColorForm(f => ({ ...f, color_name: e.target.value }))} placeholder="Black" /></div>
                <div><label className="text-[10px] text-muted-foreground">Hex</label><Input type="color" className="h-8 text-xs" value={colorForm.hex_value} onChange={e => setColorForm(f => ({ ...f, hex_value: e.target.value }))} /></div>
                <div><label className="text-[10px] text-muted-foreground">Pantone</label><Input className="h-8 text-xs" value={colorForm.pantone_code} onChange={e => setColorForm(f => ({ ...f, pantone_code: e.target.value }))} /></div>
                <Button size="sm" className="h-8 text-xs" onClick={handleAddColor} disabled={savingColor}>{savingColor ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}</Button>
              </div>
            )}
            {colorways.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No colorways yet</p>
            ) : (
              <div className="space-y-2">
                {colorways.map(c => {
                  const ldCfg = c.lab_dip_status ? LAB_DIP_CONFIG[c.lab_dip_status as LabDipStatus] : null
                  return (
                    <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-8 h-8 rounded-lg border border-border flex-shrink-0" style={{ backgroundColor: c.hex_value || '#ccc' }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{c.color_code}</span>
                          <span className="text-xs text-muted-foreground">{c.color_name}</span>
                          {c.pantone_code && <span className="text-[10px] text-muted-foreground font-mono">{c.pantone_code}</span>}
                          {ldCfg && <Badge style={{ backgroundColor: ldCfg.bg, color: ldCfg.color }} className="text-[9px]">Lab Dip: {ldCfg.label}</Badge>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders">
          {orders.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No orders booked for this style</p>
              <Link href="/merchandising/orders/new"><Button size="sm" variant="outline" className="mt-2 text-xs">Book Order</Button></Link>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Buyer</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">PO #</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Color</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Units</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Value</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Delivery</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {orders.map(o => {
                      const osCfg = ORDER_STATUS_CONFIG[o.status]
                      return (
                        <tr key={o.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium">{o.buyer_name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{o.buyer_po_number || '—'}</td>
                          <td className="px-3 py-2">{o.colorways?.color_name || '—'}</td>
                          <td className="px-3 py-2 text-right">{o.total_units}</td>
                          <td className="px-3 py-2 text-right font-mono">{o.total_value ? `$${Number(o.total_value).toFixed(2)}` : '—'}</td>
                          <td className="px-3 py-2">{o.delivery_date || '—'}</td>
                          <td className="px-3 py-2"><Badge style={{ backgroundColor: osCfg.bg, color: osCfg.color }} className="text-[10px]">{osCfg.label}</Badge></td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot><tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td>
                    <td className="px-3 py-2 text-right font-bold">{totalOrderUnits}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">${orders.reduce((s, o) => s + (o.total_value || 0), 0).toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr></tfoot>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
