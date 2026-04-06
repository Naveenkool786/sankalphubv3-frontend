'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Loader2, Save, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import {
  COST_STATUS_CONFIG, COST_CATEGORY_CONFIG, SUPPORTED_CURRENCIES,
  formatMoney, getCurrencySymbol, type CostSheet, type CostSheetItem, type CostCategory,
} from '@/lib/types/costing'
import { addCostSheetItem, updateCostSheetItem, deleteCostSheetItem, updateCostSheetStatus, updateCostSheetFOB } from '@/lib/actions/costing'

interface Props { sheet: CostSheet; items: CostSheetItem[]; canManage: boolean }

const CATEGORY_KEYS = Object.keys(COST_CATEGORY_CONFIG) as CostCategory[]

export function CostSheetDetailClient({ sheet, items, canManage }: Props) {
  const statusCfg = COST_STATUS_CONFIG[sheet.status] || COST_STATUS_CONFIG.draft
  const sym = getCurrencySymbol(sheet.currency)

  // Editable items state
  const [editItems, setEditItems] = useState<Record<string, {
    cost_category: CostCategory; description: string; supplier: string; unit: string;
    consumption: string; unit_price: string; wastage_percentage: string
  }>>(
    Object.fromEntries(items.map(i => [i.id, {
      cost_category: i.cost_category,
      description: i.description,
      supplier: i.supplier || '',
      unit: i.unit,
      consumption: String(i.consumption),
      unit_price: String(i.unit_price),
      wastage_percentage: String(i.wastage_percentage),
    }]))
  )

  const [saving, setSaving] = useState(false)
  const [statusLoading, setStatusLoading] = useState('')
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState<CostCategory>('fabric')
  const [fobForm, setFobForm] = useState({ target_fob: String(sheet.target_fob || ''), actual_fob: String(sheet.actual_fob || '') })
  const [savingFob, setSavingFob] = useState(false)

  // Calculate totals from editable state
  const calcTotal = (id: string) => {
    const e = editItems[id]
    if (!e) return 0
    const c = parseFloat(e.consumption) || 0
    const p = parseFloat(e.unit_price) || 0
    const w = parseFloat(e.wastage_percentage) || 0
    return c * p * (1 + w / 100)
  }

  const totalCost = items.reduce((s, i) => s + calcTotal(i.id), 0)

  // Group by category for pie chart
  const categoryTotals: Record<string, number> = {}
  items.forEach(i => {
    const cat = editItems[i.id]?.cost_category || i.cost_category
    categoryTotals[cat] = (categoryTotals[cat] || 0) + calcTotal(i.id)
  })
  const pieData = Object.entries(categoryTotals)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: COST_CATEGORY_CONFIG[k as CostCategory]?.label || k, value: Math.round(v * 100) / 100, color: COST_CATEGORY_CONFIG[k as CostCategory]?.color || '#999' }))

  const updateField = (id: string, field: string, value: string) => {
    setEditItems(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const handleSaveItem = async (itemId: string) => {
    const e = editItems[itemId]
    if (!e) return
    setSaving(true)
    const result = await updateCostSheetItem(itemId, sheet.id, {
      cost_category: e.cost_category,
      description: e.description,
      supplier: e.supplier,
      unit: e.unit,
      consumption: parseFloat(e.consumption) || 0,
      unit_price: parseFloat(e.unit_price) || 0,
      wastage_percentage: parseFloat(e.wastage_percentage) || 0,
    })
    setSaving(false)
    if (result.success) toast.success('Item updated')
    else toast.error('Failed', { description: result.error })
  }

  const handleAddItem = async () => {
    setAdding(true)
    const result = await addCostSheetItem(sheet.id, {
      cost_category: newCat,
      description: COST_CATEGORY_CONFIG[newCat]?.label || newCat,
      unit: newCat === 'CMT' ? 'pcs' : 'yard',
    })
    setAdding(false)
    if (result.success) toast.success('Item added')
    else toast.error('Failed', { description: result.error })
  }

  const handleDeleteItem = async (itemId: string) => {
    const result = await deleteCostSheetItem(itemId, sheet.id)
    if (result.success) toast.success('Item removed')
    else toast.error('Failed', { description: result.error })
  }

  const handleStatusChange = async (status: string) => {
    setStatusLoading(status)
    const result = await updateCostSheetStatus(sheet.id, status)
    setStatusLoading('')
    if (result.success) toast.success(`Status updated to ${status.replace(/_/g, ' ')}`)
    else toast.error('Failed', { description: result.error })
  }

  const handleSaveFob = async () => {
    setSavingFob(true)
    const result = await updateCostSheetFOB(sheet.id, {
      target_fob: fobForm.target_fob ? parseFloat(fobForm.target_fob) : undefined,
      actual_fob: fobForm.actual_fob ? parseFloat(fobForm.actual_fob) : undefined,
    })
    setSavingFob(false)
    if (result.success) toast.success('FOB updated')
    else toast.error('Failed', { description: result.error })
  }

  const actualFob = parseFloat(fobForm.actual_fob) || 0
  const margin = actualFob > 0 ? ((actualFob - totalCost) / actualFob * 100) : 0
  const marginColor = margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div>
      <Link href="/costing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Costing
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{sheet.style_number || sheet.style_name || 'Cost Sheet'}</h1>
            <Badge className="text-[10px]" variant="secondary">v{sheet.version}</Badge>
            <Badge style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {[sheet.projects?.name, sheet.style_name, sheet.currency].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Status actions */}
      {canManage && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {sheet.status === 'draft' && (
            <Button size="sm" className="text-xs gap-1" onClick={() => handleStatusChange('pending_approval')} disabled={!!statusLoading}>
              {statusLoading === 'pending_approval' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Submit for Approval
            </Button>
          )}
          {sheet.status === 'pending_approval' && (
            <Button size="sm" className="text-xs gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange('approved')} disabled={!!statusLoading}>
              {statusLoading === 'approved' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Approve
            </Button>
          )}
          {(sheet.status === 'approved') && (
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleStatusChange('revised')} disabled={!!statusLoading}>Revise</Button>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold font-mono">{sym}{totalCost.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Total Cost/Garment</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold font-mono">{sheet.target_fob ? `${sym}${Number(sheet.target_fob).toFixed(2)}` : '—'}</p>
          <p className="text-[10px] text-muted-foreground">Target FOB</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold font-mono">{actualFob > 0 ? `${sym}${actualFob.toFixed(2)}` : '—'}</p>
          <p className="text-[10px] text-muted-foreground">Actual FOB</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className={`text-lg font-bold font-mono ${actualFob > 0 ? marginColor : ''}`}>
            {actualFob > 0 ? `${margin.toFixed(1)}%` : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground">Margin</p>
        </div>
      </div>

      <Tabs defaultValue="bom">
        <TabsList className="bg-muted/50 mb-4">
          <TabsTrigger value="bom">BOM ({items.length})</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="fob">FOB & Margin</TabsTrigger>
        </TabsList>

        <TabsContent value="bom">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Supplier</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Unit</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Consumption</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Price</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Waste %</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Total</th>
                    {canManage && <th className="px-3 py-2.5 w-20"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map(item => {
                    const e = editItems[item.id]
                    if (!e) return null
                    const rowTotal = calcTotal(item.id)
                    return (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2">
                          {canManage ? (
                            <select className="w-24 px-1 py-1 rounded border border-border bg-background text-xs" value={e.cost_category} onChange={ev => updateField(item.id, 'cost_category', ev.target.value)}>
                              {CATEGORY_KEYS.map(k => <option key={k} value={k}>{COST_CATEGORY_CONFIG[k].label}</option>)}
                            </select>
                          ) : (
                            <span style={{ color: COST_CATEGORY_CONFIG[e.cost_category]?.color }}>{COST_CATEGORY_CONFIG[e.cost_category]?.label}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {canManage ? (
                            <input className="w-32 px-2 py-1 rounded border border-border bg-background text-xs" value={e.description} onChange={ev => updateField(item.id, 'description', ev.target.value)} />
                          ) : e.description}
                        </td>
                        <td className="px-3 py-2">
                          {canManage ? (
                            <input className="w-24 px-2 py-1 rounded border border-border bg-background text-xs" value={e.supplier} onChange={ev => updateField(item.id, 'supplier', ev.target.value)} placeholder="—" />
                          ) : (e.supplier || '—')}
                        </td>
                        <td className="px-3 py-2">
                          {canManage ? (
                            <select className="w-16 px-1 py-1 rounded border border-border bg-background text-xs" value={e.unit} onChange={ev => updateField(item.id, 'unit', ev.target.value)}>
                              {['yard', 'meter', 'pcs', 'set', 'kg', 'roll', 'pair'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          ) : e.unit}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {canManage ? (
                            <input type="number" step="0.0001" className="w-20 px-2 py-1 rounded border border-border bg-background text-xs text-right" value={e.consumption} onChange={ev => updateField(item.id, 'consumption', ev.target.value)} />
                          ) : e.consumption}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {canManage ? (
                            <input type="number" step="0.0001" className="w-20 px-2 py-1 rounded border border-border bg-background text-xs text-right" value={e.unit_price} onChange={ev => updateField(item.id, 'unit_price', ev.target.value)} />
                          ) : e.unit_price}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {canManage ? (
                            <input type="number" step="0.01" className="w-16 px-2 py-1 rounded border border-border bg-background text-xs text-right" value={e.wastage_percentage} onChange={ev => updateField(item.id, 'wastage_percentage', ev.target.value)} />
                          ) : `${e.wastage_percentage}%`}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">{sym}{rowTotal.toFixed(4)}</td>
                        {canManage && (
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <button onClick={() => handleSaveItem(item.id)} className="p-1 hover:bg-muted rounded" title="Save">
                                <Save className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                              <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:bg-red-50 rounded" title="Delete">
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan={7} className="px-3 py-2.5 text-right font-semibold text-foreground">Total Cost per Garment</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">{sym}{totalCost.toFixed(4)}</td>
                    {canManage && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
            {canManage && (
              <div className="p-3 border-t border-border flex items-center gap-2">
                <select className="h-8 px-2 rounded border border-border bg-background text-xs" value={newCat} onChange={e => setNewCat(e.target.value as CostCategory)}>
                  {CATEGORY_KEYS.map(k => <option key={k} value={k}>{COST_CATEGORY_CONFIG[k].label}</option>)}
                </select>
                <Button size="sm" variant="outline" className="text-xs gap-1 h-8" onClick={handleAddItem} disabled={adding}>
                  {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add Row
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-4">Cost Breakdown by Category</h3>
            {pieData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `${sym}${Number(value).toFixed(4)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Add BOM items to see breakdown</p>
            )}
            <div className="mt-4 space-y-1.5">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-foreground">{d.name}</span>
                  </div>
                  <span className="font-mono">{sym}{d.value.toFixed(4)} ({totalCost > 0 ? ((d.value / totalCost) * 100).toFixed(1) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fob">
          <div className="bg-card rounded-xl border border-border p-5 max-w-md">
            <h3 className="text-sm font-semibold mb-4">FOB & Margin Analysis</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Target FOB ({sheet.currency})</label>
                <input type="number" step="0.01" className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm mt-1" value={fobForm.target_fob} onChange={e => setFobForm(f => ({ ...f, target_fob: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Actual FOB ({sheet.currency})</label>
                <input type="number" step="0.01" className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm mt-1" value={fobForm.actual_fob} onChange={e => setFobForm(f => ({ ...f, actual_fob: e.target.value }))} />
              </div>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Cost</span><span className="font-mono font-semibold">{sym}{totalCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Actual FOB</span><span className="font-mono font-semibold">{actualFob > 0 ? `${sym}${actualFob.toFixed(2)}` : '—'}</span></div>
                <div className="flex justify-between border-t border-border pt-1.5">
                  <span className="text-muted-foreground font-semibold">Margin</span>
                  <span className={`font-mono font-bold ${actualFob > 0 ? marginColor : ''}`}>
                    {actualFob > 0 ? `${sym}${(actualFob - totalCost).toFixed(2)} (${margin.toFixed(1)}%)` : '—'}
                  </span>
                </div>
              </div>
              {canManage && (
                <Button size="sm" className="gap-1.5" onClick={handleSaveFob} disabled={savingFob} style={{ backgroundColor: '#D4A843' }}>
                  {savingFob ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save FOB
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
