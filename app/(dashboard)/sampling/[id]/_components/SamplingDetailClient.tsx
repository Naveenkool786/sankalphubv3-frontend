'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, MessageSquare, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { SAMPLE_TYPE_CONFIG, SAMPLE_STATUS_CONFIG, STAGE_ORDER, type SampleRequest, type SampleComment, type SampleMeasurement } from '@/lib/types/sampling'
import { updateSampleStatus, addSampleComment, addSampleMeasurement } from '@/lib/actions/sampling'

interface Props {
  sample: SampleRequest
  comments: SampleComment[]
  measurements: SampleMeasurement[]
  canManage: boolean
  userRole: string
}

export function SamplingDetailClient({ sample, comments, measurements, canManage, userRole }: Props) {
  const typeCfg = SAMPLE_TYPE_CONFIG[sample.sample_type] || SAMPLE_TYPE_CONFIG.proto
  const statusCfg = SAMPLE_STATUS_CONFIG[sample.status] || SAMPLE_STATUS_CONFIG.requested
  const stageIndex = STAGE_ORDER.indexOf(sample.sample_type)
  const isReviewer = userRole === 'super_admin' || userRole === 'brand_manager'
  const canReview = isReviewer && (sample.status === 'submitted' || sample.status === 'under_review')

  const [commentText, setCommentText] = useState('')
  const [commentType, setCommentType] = useState('general')
  const [savingComment, setSavingComment] = useState(false)
  const [actionLoading, setActionLoading] = useState('')

  // Measurement form
  const [measForm, setMeasForm] = useState({ size: '', point_of_measure: '', spec_value: '', actual_value: '', tolerance_plus: '0.5', tolerance_minus: '0.5' })
  const [savingMeas, setSavingMeas] = useState(false)

  const handleComment = async () => {
    if (!commentText.trim()) { toast.error('Enter a comment'); return }
    setSavingComment(true)
    const result = await addSampleComment(sample.id, { comment: commentText, comment_type: commentType })
    setSavingComment(false)
    if (result.success) { toast.success('Comment added'); setCommentText('') }
    else toast.error('Failed', { description: result.error })
  }

  const handleStatusChange = async (status: string, requireComment = false) => {
    if (requireComment && !commentText.trim()) { toast.error('Please add a comment explaining your decision'); return }
    setActionLoading(status)
    const result = await updateSampleStatus(sample.id, status, commentText.trim() || undefined)
    setActionLoading('')
    if (result.success) {
      toast.success(`Sample ${status.replace(/_/g, ' ')}`)
      setCommentText('')
    } else {
      toast.error('Failed', { description: result.error })
    }
  }

  const handleAddMeasurement = async () => {
    if (!measForm.size || !measForm.point_of_measure || !measForm.spec_value) { toast.error('Fill required measurement fields'); return }
    setSavingMeas(true)
    const result = await addSampleMeasurement(sample.id, {
      size: measForm.size,
      point_of_measure: measForm.point_of_measure,
      spec_value: parseFloat(measForm.spec_value),
      actual_value: measForm.actual_value ? parseFloat(measForm.actual_value) : undefined,
      tolerance_plus: parseFloat(measForm.tolerance_plus) || 0.5,
      tolerance_minus: parseFloat(measForm.tolerance_minus) || 0.5,
      revision_number: sample.revision_number,
    })
    setSavingMeas(false)
    if (result.success) {
      toast.success('Measurement added')
      setMeasForm({ size: '', point_of_measure: '', spec_value: '', actual_value: '', tolerance_plus: '0.5', tolerance_minus: '0.5' })
    } else toast.error('Failed', { description: result.error })
  }

  const passCount = measurements.filter(m => m.status === 'pass').length
  const failCount = measurements.filter(m => m.status === 'fail').length
  const measTotal = measurements.filter(m => m.status !== 'pending').length

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'

  return (
    <div>
      <Link href="/sampling" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Sampling
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{sample.request_number}</h1>
            <Badge style={{ backgroundColor: typeCfg.bg, color: typeCfg.color }}>{typeCfg.label}</Badge>
            <Badge style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</Badge>
            {sample.revision_number > 1 && <Badge variant="secondary">Rev {sample.revision_number}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {[sample.style_name, sample.factories?.name, sample.buyer_brand, sample.color].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Stage tracker */}
      <div className="flex items-center gap-1 mb-6">
        {STAGE_ORDER.map((stage, i) => {
          const cfg = SAMPLE_TYPE_CONFIG[stage]
          const isCurrent = i === stageIndex
          const isPast = i < stageIndex
          return (
            <div key={stage} className="flex items-center gap-1">
              {i > 0 && <div className="w-6 h-px" style={{ backgroundColor: isPast ? '#2E7D32' : 'var(--border)' }} />}
              <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium', isCurrent ? 'ring-2 ring-[#D4A843]' : '')}
                style={{ backgroundColor: isPast ? '#E8F5E9' : isCurrent ? cfg.bg : '#f5f5f5', color: isPast ? '#2E7D32' : isCurrent ? cfg.color : '#999' }}>
                {isPast ? <CheckCircle2 className="w-3 h-3" /> : null}
                {cfg.label}
              </div>
            </div>
          )
        })}
      </div>

      <Tabs defaultValue="review">
        <TabsList className="bg-muted/50 mb-4">
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Review Tab */}
        <TabsContent value="review">
          <div className="space-y-4">
            {/* Action buttons */}
            {canReview && (
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3">Review Actions</p>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" className="gap-1 text-xs" style={{ backgroundColor: '#2E7D32' }} onClick={() => handleStatusChange('approved')} disabled={!!actionLoading}>
                    {actionLoading === 'approved' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Approve
                  </Button>
                  <Button size="sm" className="gap-1 text-xs" style={{ backgroundColor: '#D4A843' }} onClick={() => handleStatusChange('approved_with_comments', true)} disabled={!!actionLoading}>
                    Approve with Comments
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1 text-xs" onClick={() => handleStatusChange('rejected', true)} disabled={!!actionLoading}>
                    {actionLoading === 'rejected' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Comment thread */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">Comments ({comments.length})</h3>
              {comments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {comments.map(c => (
                    <div key={c.id} className={cn('p-3 rounded-lg border', c.comment_type === 'approval' ? 'border-green-200 bg-green-50/50' : c.comment_type === 'rejection' ? 'border-red-200 bg-red-50/50' : 'border-border')}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">{(c.profiles as any)?.full_name || 'User'}</span>
                        {c.author_role && <Badge variant="secondary" className="text-[9px]">{c.author_role}</Badge>}
                        {c.comment_type !== 'general' && <Badge variant="secondary" className="text-[9px]">{c.comment_type}</Badge>}
                        <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(c.created_at), 'dd MMM HH:mm')}</span>
                      </div>
                      <p className="text-sm text-foreground">{c.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 mb-4">No comments yet</p>
              )}

              {/* Add comment */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select className="h-9 px-3 rounded-lg border border-border bg-background text-xs w-[130px]" value={commentType} onChange={e => setCommentType(e.target.value)}>
                    {['general', 'fit', 'fabric', 'color', 'construction', 'measurement'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                  <textarea className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[36px] resize-none" placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} rows={1} />
                  <Button size="sm" onClick={handleComment} disabled={savingComment} className="gap-1">
                    {savingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />} Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="measurements">
          <div className="space-y-4">
            {/* Summary */}
            {measTotal > 0 && (
              <div className="flex gap-3">
                <div className="bg-card rounded-xl border border-border p-3 flex-1 text-center">
                  <p className="text-lg font-bold text-green-600">{passCount}</p>
                  <p className="text-[10px] text-muted-foreground">Pass</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-3 flex-1 text-center">
                  <p className="text-lg font-bold text-red-600">{failCount}</p>
                  <p className="text-[10px] text-muted-foreground">Fail</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-3 flex-1 text-center">
                  <p className="text-lg font-bold" style={{ color: passCount > 0 ? '#2E7D32' : '#666' }}>{measTotal > 0 ? Math.round((passCount / measTotal) * 100) : 0}%</p>
                  <p className="text-[10px] text-muted-foreground">Pass Rate</p>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Size</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Point of Measure</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Spec</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Actual</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Tol+</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Tol-</th>
                      <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {measurements.map(m => (
                      <tr key={m.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2">{m.size}</td>
                        <td className="px-4 py-2">{m.point_of_measure}</td>
                        <td className="px-4 py-2 text-right">{m.spec_value}</td>
                        <td className="px-4 py-2 text-right font-medium">{m.actual_value ?? '—'}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">+{m.tolerance_plus}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">-{m.tolerance_minus}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold',
                            m.status === 'pass' ? 'bg-green-100 text-green-700' : m.status === 'fail' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                          )}>{m.status}</span>
                        </td>
                      </tr>
                    ))}
                    {measurements.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No measurements yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add measurement */}
            {canManage && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold mb-3">Add Measurement</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  <input className={selCls} placeholder="Size" value={measForm.size} onChange={e => setMeasForm(f => ({ ...f, size: e.target.value }))} />
                  <input className={selCls} placeholder="Point of Measure" value={measForm.point_of_measure} onChange={e => setMeasForm(f => ({ ...f, point_of_measure: e.target.value }))} />
                  <input type="number" step="0.1" className={selCls} placeholder="Spec" value={measForm.spec_value} onChange={e => setMeasForm(f => ({ ...f, spec_value: e.target.value }))} />
                  <input type="number" step="0.1" className={selCls} placeholder="Actual" value={measForm.actual_value} onChange={e => setMeasForm(f => ({ ...f, actual_value: e.target.value }))} />
                  <input type="number" step="0.1" className={selCls} placeholder="Tol+" value={measForm.tolerance_plus} onChange={e => setMeasForm(f => ({ ...f, tolerance_plus: e.target.value }))} />
                  <input type="number" step="0.1" className={selCls} placeholder="Tol-" value={measForm.tolerance_minus} onChange={e => setMeasForm(f => ({ ...f, tolerance_minus: e.target.value }))} />
                </div>
                <Button size="sm" className="mt-3 gap-1" onClick={handleAddMeasurement} disabled={savingMeas}>
                  {savingMeas ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-4">Activity History</h3>
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{
                    backgroundColor: c.comment_type === 'approval' ? '#2E7D32' : c.comment_type === 'rejection' ? '#CC0000' : '#D4A843'
                  }} />
                  <div>
                    <span className="font-medium text-foreground">{(c.profiles as any)?.full_name || 'User'}</span>
                    <span className="text-muted-foreground ml-1">
                      {c.comment_type === 'approval' ? 'approved the sample' : c.comment_type === 'rejection' ? 'rejected the sample' : `commented (${c.comment_type})`}
                    </span>
                    <p className="text-muted-foreground mt-0.5">{c.comment}</p>
                    <p className="text-muted-foreground/60 mt-0.5">{format(new Date(c.created_at), 'dd MMM yyyy HH:mm')}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
