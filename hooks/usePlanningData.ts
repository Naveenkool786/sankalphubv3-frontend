'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  startOfWeek, endOfWeek, startOfMonth, subWeeks,
  isWithinInterval, differenceInDays, getDaysInMonth, format,
} from 'date-fns'

/* ─── TYPES ─── */

export interface OrderRow {
  id: string
  order_number: string
  product_category: string
  product_name: string | null
  quantity: number
  units_produced: number
  daily_target: number
  status: string
  priority: string
  start_date: string | null
  expected_delivery: string | null
  time_slot_start: string | null
  time_slot_end: string | null
  factory_id: string | null
  factoryName: string | null
  maxCapacity: number
  notes: string | null
}

export interface FactoryRow {
  id: string
  name: string
  is_active: boolean
  max_capacity: number | null
}

export interface FactoryUtilisation {
  factory: FactoryRow
  activeOrders: number
  maxCapacity: number
  utilisationPct: number
}

export interface TimelineOrder extends OrderRow {
  leftPct: number
  widthPct: number
  color: string
}

export interface FactoryDPR {
  factory: FactoryRow
  produced: number
  target: number
  achievement: number
  progressColor: string
  passRate: number
  critical: number
  major: number
  minor: number
  status: string
}

export interface PlanningData {
  // Planning KPIs
  activeOrders: number
  thisWeekInspections: number
  inspectionsDelta: number
  delayedOrders: number
  wipCount: number
  activeFactoriesCount: number
  // Schedule
  scheduleOrders: OrderRow[]
  factoryUtilisation: FactoryUtilisation[]
  // Timeline
  timelineOrders: TimelineOrder[]
  onTrack: number
  delayedCount: number
  dueThisMonth: number
  totalOrders: number
  // DPR KPIs
  totalProduced: number
  totalTarget: number
  overallAchievement: number
  overallPassRate: number
  todayInspectionsCount: number
  criticalToday: number
  majorToday: number
  minorToday: number
  totalDefectsToday: number
  avgCycleTime: number | null
  // Per-factory DPR
  factoryDPR: FactoryDPR[]
  // Meta
  loading: boolean
}

const DEFAULT_DATA: PlanningData = {
  activeOrders: 0, thisWeekInspections: 0, inspectionsDelta: 0,
  delayedOrders: 0, wipCount: 0, activeFactoriesCount: 0,
  scheduleOrders: [], factoryUtilisation: [],
  timelineOrders: [], onTrack: 0, delayedCount: 0, dueThisMonth: 0, totalOrders: 0,
  totalProduced: 0, totalTarget: 0, overallAchievement: 0, overallPassRate: 0,
  todayInspectionsCount: 0, criticalToday: 0, majorToday: 0, minorToday: 0,
  totalDefectsToday: 0, avgCycleTime: null,
  factoryDPR: [],
  loading: true,
}

/* ─── HOOK ─── */

export function usePlanningData(selectedDate: string, viewMonth: Date): PlanningData {
  const [data, setData] = useState<PlanningData>(DEFAULT_DATA)

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('org_id')
          .eq('id', user.id)
          .single()

        const orgId = (profile as any)?.org_id
        if (!orgId) return

        // Wrap each query independently — if a table doesn't exist, return []
        async function safeQuery(query: Promise<{ data: any; error: any }>) {
          try {
            const res = await query
            return res.data ?? []
          } catch { return [] }
        }

        const [orders, factories, inspections, defects, dailyProduction] = await Promise.all([
          safeQuery((supabase.from('orders') as any).select('*, factories(name, max_capacity)').eq('org_id', orgId)),
          safeQuery((supabase.from('factories') as any).select('id, name, is_active, max_capacity').eq('org_id', orgId).eq('is_active', true)),
          safeQuery((supabase.from('inspections') as any).select('id, result, status, score, critical_defects, major_defects, minor_defects, inspection_date, factory_id, created_at').eq('org_id', orgId)),
          safeQuery((supabase.from('defect_records') as any).select('id, severity, inspection_id, created_at').eq('org_id', orgId)),
          safeQuery((supabase.from('daily_production') as any).select('*').eq('org_id', orgId)),
        ])

        if (cancelled) return

        const result = calculateAll({
          orders,
          factories,
          inspections,
          defects,
          dailyProduction,
          selectedDate,
          viewMonth,
        })

        setData({ ...result, loading: false })
      } catch (err) {
        console.error('[PlanningData]', err)
        if (!cancelled) setData(prev => ({ ...prev, loading: false }))
      }
    }

    setData(prev => ({ ...prev, loading: true }))
    fetchAll()
    return () => { cancelled = true }
  }, [selectedDate, viewMonth.toISOString()])

  return data
}

/* ─── CALCULATE ALL ─── */

function calculateAll(input: {
  orders: any[]
  factories: any[]
  inspections: any[]
  defects: any[]
  dailyProduction: any[]
  selectedDate: string
  viewMonth: Date
}): Omit<PlanningData, 'loading'> {
  const { orders: rawOrders, factories, inspections, defects, dailyProduction, selectedDate, viewMonth } = input
  const today = new Date()

  // Enrich orders with factory info
  const orders: OrderRow[] = rawOrders.map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    product_category: o.product_category,
    product_name: o.product_name,
    quantity: o.quantity,
    units_produced: o.units_produced,
    daily_target: o.daily_target,
    status: o.status,
    priority: o.priority,
    start_date: o.start_date,
    expected_delivery: o.expected_delivery,
    time_slot_start: o.time_slot_start,
    time_slot_end: o.time_slot_end,
    factory_id: o.factory_id,
    factoryName: o.factories?.name ?? null,
    maxCapacity: o.factories?.max_capacity ?? 4,
    notes: o.notes,
  }))

  // Build inspection → factory map for defect lookups
  const inspectionFactoryMap: Record<string, string> = {}
  const inspectionDateMap: Record<string, string> = {}
  for (const i of inspections) {
    inspectionFactoryMap[i.id] = i.factory_id
    inspectionDateMap[i.id] = (i.inspection_date ?? i.created_at?.split('T')[0] ?? '')
  }

  // ── PLANNING KPIs ──
  const activeOrders = orders.filter(o => ['confirmed', 'in_production', 'in_inspection'].includes(o.status)).length

  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)
  const thisWeekInspections = inspections.filter((i: any) => {
    const d = new Date(i.inspection_date ?? i.created_at)
    return isWithinInterval(d, { start: weekStart, end: weekEnd })
  }).length
  const lastWeekInspections = inspections.filter((i: any) => {
    const d = new Date(i.inspection_date ?? i.created_at)
    return isWithinInterval(d, { start: subWeeks(weekStart, 1), end: subWeeks(weekEnd, 1) })
  }).length
  const inspectionsDelta = thisWeekInspections - lastWeekInspections

  const delayedOrders = orders.filter(o =>
    o.expected_delivery && new Date(o.expected_delivery) < today && !['completed', 'cancelled'].includes(o.status)
  ).length

  const wipCount = orders.filter(o => o.status === 'in_production').length +
    inspections.filter((i: any) => i.status === 'in_progress').length

  // ── RESOURCE UTILISATION ──
  const factoryUtilisation: FactoryUtilisation[] = factories.map((f: any) => {
    const activeAtFactory = orders.filter(o => o.factory_id === f.id && ['in_production', 'confirmed'].includes(o.status)).length
    const maxCap = f.max_capacity ?? 4
    return {
      factory: f,
      activeOrders: activeAtFactory,
      maxCapacity: maxCap,
      utilisationPct: Math.min(100, maxCap > 0 ? Math.round((activeAtFactory / maxCap) * 100) : 0),
    }
  })

  // ── TIMELINE ──
  const monthStart = startOfMonth(viewMonth)
  const daysInMonth = getDaysInMonth(viewMonth)

  const timelineOrders: TimelineOrder[] = orders
    .filter(o => o.status !== 'cancelled')
    .map(o => {
      const start = o.start_date ? new Date(o.start_date) : monthStart
      const end = o.expected_delivery ? new Date(o.expected_delivery) : start
      const leftPct = Math.max(0, Math.min(100, (differenceInDays(start, monthStart) / daysInMonth) * 100))
      const widthPct = Math.max(2, Math.min(100 - leftPct, (differenceInDays(end, start) / daysInMonth) * 100))
      const isDelayed = end < today && o.status !== 'completed'
      const color = o.status === 'completed' ? '#1D9E75' : isDelayed ? '#E24B4A' : o.status === 'in_production' ? '#378ADD' : o.status === 'in_inspection' ? '#534AB7' : '#C9A96E'
      return { ...o, leftPct, widthPct, color }
    })

  const onTrack = orders.filter(o => !o.expected_delivery || new Date(o.expected_delivery) >= today || o.status === 'completed').length
  const dueThisMonth = orders.filter(o => {
    if (!o.expected_delivery) return false
    const d = new Date(o.expected_delivery)
    return d.getMonth() === viewMonth.getMonth() && d.getFullYear() === viewMonth.getFullYear()
  }).length

  // ── DPR ──
  const todayDP = dailyProduction.filter((dp: any) => dp.date === selectedDate)
  const totalProduced = todayDP.reduce((s: number, dp: any) => s + (dp.units_produced ?? 0), 0)
  const totalTarget = todayDP.reduce((s: number, dp: any) => s + (dp.daily_target ?? 0), 0)
  const overallAchievement = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0

  const todayInspections = inspections.filter((i: any) => (i.inspection_date ?? i.created_at?.split('T')[0]) === selectedDate)
  const passedToday = todayInspections.filter((i: any) => i.result === 'pass').length
  const overallPassRate = todayInspections.length > 0 ? Math.round((passedToday / todayInspections.length) * 100) : 0

  const todayDefects = defects.filter((d: any) => {
    const dDate = inspectionDateMap[d.inspection_id] ?? d.created_at?.split('T')[0]
    return dDate === selectedDate
  })
  const criticalToday = todayDefects.filter((d: any) => d.severity === 'critical').length
  const majorToday = todayDefects.filter((d: any) => d.severity === 'major').length
  const minorToday = todayDefects.filter((d: any) => d.severity === 'minor').length

  const cycleRecords = todayDP.filter((dp: any) => dp.cycle_time_minutes != null)
  const avgCycleTime = cycleRecords.length > 0
    ? parseFloat((cycleRecords.reduce((s: number, dp: any) => s + dp.cycle_time_minutes, 0) / cycleRecords.length).toFixed(1))
    : null

  // Per-factory DPR
  const factoryDPR: FactoryDPR[] = factories.map((f: any) => {
    const fp = todayDP.find((dp: any) => dp.factory_id === f.id)
    const produced = fp?.units_produced ?? 0
    const target = fp?.daily_target ?? 0
    const achievement = target > 0 ? Math.round((produced / target) * 100) : 0
    const progressColor = achievement >= 90 ? '#1D9E75' : achievement >= 70 ? '#BA7517' : '#E24B4A'

    const fInspections = todayInspections.filter((i: any) => i.factory_id === f.id)
    const fPassed = fInspections.filter((i: any) => i.result === 'pass').length
    const passRate = fInspections.length > 0 ? Math.round((fPassed / fInspections.length) * 100) : 0

    const fDefects = todayDefects.filter((d: any) => inspectionFactoryMap[d.inspection_id] === f.id)
    const critical = fDefects.filter((d: any) => d.severity === 'critical').length
    const major = fDefects.filter((d: any) => d.severity === 'major').length
    const minor = fDefects.filter((d: any) => d.severity === 'minor').length

    const status = orders.find(o => o.factory_id === f.id && o.status === 'in_production') ? 'in_production'
      : orders.find(o => o.factory_id === f.id && o.status === 'delayed') ? 'delayed' : 'scheduled'

    return { factory: f, produced, target, achievement, progressColor, passRate, critical, major, minor, status }
  })

  return {
    activeOrders, thisWeekInspections, inspectionsDelta, delayedOrders, wipCount,
    activeFactoriesCount: factories.length,
    scheduleOrders: orders, factoryUtilisation,
    timelineOrders, onTrack, delayedCount: delayedOrders, dueThisMonth, totalOrders: orders.filter(o => o.status !== 'cancelled').length,
    totalProduced, totalTarget, overallAchievement, overallPassRate,
    todayInspectionsCount: todayInspections.length,
    criticalToday, majorToday, minorToday, totalDefectsToday: todayDefects.length,
    avgCycleTime,
    factoryDPR,
  }
}
