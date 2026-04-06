'use client'

import { PRODUCTION_STAGES, STAGE_COLORS } from '@/lib/planning/stages'
import type { PlanningData, OrderRow } from '@/hooks/usePlanningData'

interface Props {
  data: PlanningData
}

const CATEGORIES = ['garments', 'footwear', 'gloves', 'headwear', 'accessories']

export function WipView({ data }: Props) {
  // Group active orders by category for WIP display
  const activeOrders = data.scheduleOrders.filter(o =>
    ['confirmed', 'in_production', 'in_inspection'].includes(o.status)
  )

  // Determine which category has orders
  const usedCategories = CATEGORIES.filter(cat =>
    activeOrders.some(o => (o.product_category || '').toLowerCase() === cat)
  )

  // If no orders, show at least garments as example
  const displayCategories = usedCategories.length > 0 ? usedCategories : ['garments']

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-medium text-foreground">WIP Tracker</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Work-in-progress across production stages</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {activeOrders.length} active orders
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No active orders in production</p>
          <p className="text-xs text-muted-foreground mt-1">Orders in production will appear here as a kanban board</p>
        </div>
      ) : (
        displayCategories.map(category => {
          const stages = PRODUCTION_STAGES[category] || PRODUCTION_STAGES.garments
          const categoryOrders = activeOrders.filter(o => (o.product_category || '').toLowerCase() === category)
          if (categoryOrders.length === 0) return null

          return (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 capitalize">{category}</h3>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
                {stages.map((stage, stageIdx) => {
                  const stageColor = STAGE_COLORS[stage] || '#6B7280'
                  // Assign orders to stages based on progress
                  const stageOrders = categoryOrders.filter(o => {
                    const progress = o.quantity > 0 ? (o.units_produced / o.quantity) : 0
                    const stageProgress = stageIdx / stages.length
                    const nextStageProgress = (stageIdx + 1) / stages.length
                    return progress >= stageProgress && progress < nextStageProgress
                  })
                  // Last stage gets completed items
                  const isLastStage = stageIdx === stages.length - 1
                  const lastStageOrders = isLastStage
                    ? categoryOrders.filter(o => {
                        const progress = o.quantity > 0 ? (o.units_produced / o.quantity) : 0
                        return progress >= (stageIdx / stages.length)
                      })
                    : stageOrders

                  const displayOrders = isLastStage ? lastStageOrders : stageOrders
                  const totalQty = displayOrders.reduce((s, o) => s + (o.units_produced || 0), 0)

                  return (
                    <div key={stage} className="bg-card rounded-xl border border-border overflow-hidden">
                      {/* Stage header */}
                      <div className="px-3 py-2 border-b border-border flex items-center justify-between" style={{ borderTopWidth: 3, borderTopColor: stageColor }}>
                        <span className="text-xs font-semibold text-foreground">{stage}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${stageColor}15`, color: stageColor }}>
                          {displayOrders.length}
                        </span>
                      </div>

                      {/* Stage total */}
                      {totalQty > 0 && (
                        <div className="px-3 py-1.5 bg-muted/30 text-[10px] text-muted-foreground">
                          {totalQty.toLocaleString()} units
                        </div>
                      )}

                      {/* Order cards */}
                      <div className="p-2 space-y-1.5 min-h-[100px]">
                        {displayOrders.length === 0 ? (
                          <div className="text-[10px] text-muted-foreground/50 text-center py-4">Empty</div>
                        ) : (
                          displayOrders.map(order => {
                            const progress = order.quantity > 0 ? Math.round((order.units_produced / order.quantity) * 100) : 0
                            const isDelayed = order.expected_delivery && new Date(order.expected_delivery) < new Date() && order.status !== 'completed'

                            return (
                              <div key={order.id} className="bg-background rounded-lg border border-border p-2.5 text-xs">
                                <div className="font-medium text-foreground truncate">{order.order_number}</div>
                                {order.factoryName && (
                                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{order.factoryName}</div>
                                )}
                                <div className="flex items-center justify-between mt-1.5">
                                  <span className="text-[10px] text-muted-foreground">{order.units_produced}/{order.quantity}</span>
                                  <span className="text-[10px] font-medium" style={{ color: progress >= 80 ? '#16a34a' : progress >= 50 ? '#d97706' : '#dc2626' }}>
                                    {progress}%
                                  </span>
                                </div>
                                <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{
                                    width: `${progress}%`,
                                    background: isDelayed ? '#dc2626' : stageColor,
                                  }} />
                                </div>
                                {isDelayed && (
                                  <div className="text-[9px] text-red-500 font-medium mt-1">Overdue</div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-[10px] text-muted-foreground">
        <span>Flow direction: Left → Right</span>
        <span>·</span>
        <span>Cards show order progress within each stage</span>
        <span>·</span>
        <span className="text-red-500">Red = Overdue</span>
      </div>
    </div>
  )
}
