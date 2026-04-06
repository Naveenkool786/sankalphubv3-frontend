'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Leaf, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { calculateESGScore, type SustainabilityMetrics } from '@/lib/types/compliance'
import { saveSustainabilityMetrics } from '@/lib/actions/compliance'

export default function SustainabilityPage() {
  const [factories, setFactories] = useState<{ id: string; name: string }[]>([])
  const [metrics, setMetrics] = useState<SustainabilityMetrics[]>([])
  const [selectedFactory, setSelectedFactory] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    metric_period: '', water_usage_liters: '', energy_usage_kwh: '', renewable_energy_pct: '',
    waste_generated_kg: '', waste_recycled_pct: '', carbon_emissions_kg: '',
    total_workers: '', female_workers_pct: '', living_wage_compliance: false,
    average_overtime_hours: '', workplace_incidents: '',
    sustainable_material_pct: '', recycled_content_pct: '', organic_content_pct: '', notes: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: f } = await (supabase.from('factories') as any).select('id, name').eq('is_active', true).order('name')
      if (f) setFactories(f)
    })()
  }, [])

  useEffect(() => {
    if (!selectedFactory) return
    (async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await (supabase.from('sustainability_metrics') as any).select('*').eq('factory_id', selectedFactory).order('metric_period', { ascending: false }).limit(10)
      if (data) setMetrics(data)
    })()
  }, [selectedFactory, saving])

  const esgScore = calculateESGScore({
    renewable_energy_pct: parseFloat(form.renewable_energy_pct) || 0,
    waste_recycled_pct: parseFloat(form.waste_recycled_pct) || 0,
    carbon_emissions_kg: parseFloat(form.carbon_emissions_kg) || 0,
    living_wage_compliance: form.living_wage_compliance,
    average_overtime_hours: parseFloat(form.average_overtime_hours) || 0,
    workplace_incidents: parseInt(form.workplace_incidents) || 0,
    sustainable_material_pct: parseFloat(form.sustainable_material_pct) || 0,
    recycled_content_pct: parseFloat(form.recycled_content_pct) || 0,
    organic_content_pct: parseFloat(form.organic_content_pct) || 0,
  })

  const radarData = [
    { dim: 'Renewable Energy', value: Math.min(100, parseFloat(form.renewable_energy_pct) || 0) },
    { dim: 'Waste Recycling', value: Math.min(100, parseFloat(form.waste_recycled_pct) || 0) },
    { dim: 'Carbon', value: Math.max(0, 100 - ((parseFloat(form.carbon_emissions_kg) || 0) / 100)) },
    { dim: 'Social', value: form.living_wage_compliance ? 80 : 20 },
    { dim: 'Sust. Material', value: Math.min(100, parseFloat(form.sustainable_material_pct) || 0) },
    { dim: 'Recycled', value: Math.min(100, parseFloat(form.recycled_content_pct) || 0) },
  ]

  const handleSave = async () => {
    if (!selectedFactory || !form.metric_period) { toast.error('Select factory and period'); return }
    setSaving(true)
    const result = await saveSustainabilityMetrics({
      factory_id: selectedFactory,
      metric_period: form.metric_period,
      water_usage_liters: parseFloat(form.water_usage_liters) || undefined,
      energy_usage_kwh: parseFloat(form.energy_usage_kwh) || undefined,
      renewable_energy_pct: parseFloat(form.renewable_energy_pct) || undefined,
      waste_generated_kg: parseFloat(form.waste_generated_kg) || undefined,
      waste_recycled_pct: parseFloat(form.waste_recycled_pct) || undefined,
      carbon_emissions_kg: parseFloat(form.carbon_emissions_kg) || undefined,
      total_workers: parseInt(form.total_workers) || undefined,
      female_workers_pct: parseFloat(form.female_workers_pct) || undefined,
      living_wage_compliance: form.living_wage_compliance,
      average_overtime_hours: parseFloat(form.average_overtime_hours) || undefined,
      workplace_incidents: parseInt(form.workplace_incidents) || undefined,
      sustainable_material_pct: parseFloat(form.sustainable_material_pct) || undefined,
      recycled_content_pct: parseFloat(form.recycled_content_pct) || undefined,
      organic_content_pct: parseFloat(form.organic_content_pct) || undefined,
      esg_score: esgScore,
      notes: form.notes || undefined,
    })
    setSaving(false)
    if (result.success) toast.success('Metrics saved')
    else toast.error('Failed', { description: result.error })
  }

  const esgColor = esgScore >= 70 ? 'text-green-600' : esgScore >= 40 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Leaf className="w-5 h-5" style={{ color: '#D4A843' }} /> ESG & Sustainability
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track environmental, social, and governance metrics</p>
      </div>

      <div className="flex gap-3 mb-6">
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={selectedFactory} onChange={e => setSelectedFactory(e.target.value)}>
          <option value="">Select factory</option>
          {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <Input className="h-9 text-sm w-40" value={form.metric_period} onChange={e => set('metric_period', e.target.value)} placeholder="2026-Q1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">ESG Score</h3>
            <span className={`text-2xl font-bold ${esgColor}`}>{esgScore}/100</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Score" dataKey="value" stroke="#D4A843" fill="#D4A843" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Entry Form */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold">Environmental</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-muted-foreground">Water Usage (L)</label><Input type="number" className="h-8 text-xs" value={form.water_usage_liters} onChange={e => set('water_usage_liters', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Energy (kWh)</label><Input type="number" className="h-8 text-xs" value={form.energy_usage_kwh} onChange={e => set('energy_usage_kwh', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Renewable %</label><Input type="number" className="h-8 text-xs" value={form.renewable_energy_pct} onChange={e => set('renewable_energy_pct', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Waste (kg)</label><Input type="number" className="h-8 text-xs" value={form.waste_generated_kg} onChange={e => set('waste_generated_kg', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Waste Recycled %</label><Input type="number" className="h-8 text-xs" value={form.waste_recycled_pct} onChange={e => set('waste_recycled_pct', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Carbon (kg CO2)</label><Input type="number" className="h-8 text-xs" value={form.carbon_emissions_kg} onChange={e => set('carbon_emissions_kg', e.target.value)} /></div>
          </div>

          <h3 className="text-sm font-semibold pt-2">Social</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-muted-foreground">Total Workers</label><Input type="number" className="h-8 text-xs" value={form.total_workers} onChange={e => set('total_workers', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Female %</label><Input type="number" className="h-8 text-xs" value={form.female_workers_pct} onChange={e => set('female_workers_pct', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Avg Overtime (hrs)</label><Input type="number" className="h-8 text-xs" value={form.average_overtime_hours} onChange={e => set('average_overtime_hours', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Incidents</label><Input type="number" className="h-8 text-xs" value={form.workplace_incidents} onChange={e => set('workplace_incidents', e.target.value)} /></div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="lwc" checked={form.living_wage_compliance} onChange={e => setForm(f => ({ ...f, living_wage_compliance: e.target.checked }))} className="rounded" />
              <label htmlFor="lwc" className="text-xs">Living Wage Compliance</label>
            </div>
          </div>

          <h3 className="text-sm font-semibold pt-2">Materials</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] text-muted-foreground">Sustainable %</label><Input type="number" className="h-8 text-xs" value={form.sustainable_material_pct} onChange={e => set('sustainable_material_pct', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Recycled %</label><Input type="number" className="h-8 text-xs" value={form.recycled_content_pct} onChange={e => set('recycled_content_pct', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Organic %</label><Input type="number" className="h-8 text-xs" value={form.organic_content_pct} onChange={e => set('organic_content_pct', e.target.value)} /></div>
          </div>

          <Button size="sm" className="gap-1.5 w-full" onClick={handleSave} disabled={saving || !selectedFactory} style={{ backgroundColor: '#D4A843' }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Metrics
          </Button>
        </div>
      </div>

      {/* History */}
      {metrics.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden mt-6">
          <div className="px-4 py-3 border-b border-border"><h3 className="text-sm font-semibold">History</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Period</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">ESG</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Renewable</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Waste Recycled</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Sust. Material</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Living Wage</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {metrics.map(m => (
                  <tr key={m.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">{m.metric_period}</td>
                    <td className="px-3 py-2 text-right font-bold">{m.esg_score ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{m.renewable_energy_pct != null ? `${m.renewable_energy_pct}%` : '—'}</td>
                    <td className="px-3 py-2 text-right">{m.waste_recycled_pct != null ? `${m.waste_recycled_pct}%` : '—'}</td>
                    <td className="px-3 py-2 text-right">{m.sustainable_material_pct != null ? `${m.sustainable_material_pct}%` : '—'}</td>
                    <td className="px-3 py-2 text-center">{m.living_wage_compliance ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
