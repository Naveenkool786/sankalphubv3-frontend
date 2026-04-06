'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TEST_CATEGORY_CONFIG, TEST_STATUS_CONFIG, type TestRequest, type TestResultRow } from '@/lib/types/testing'
import { updateTestRequestStatus, saveTestResults } from '@/lib/actions/testing'

interface Props { request: TestRequest; results: TestResultRow[]; canManage: boolean }

export function TestingDetailClient({ request, results, canManage }: Props) {
  const catCfg = TEST_CATEGORY_CONFIG[request.test_category] || TEST_CATEGORY_CONFIG.physical
  const statusCfg = TEST_STATUS_CONFIG[request.status] || TEST_STATUS_CONFIG.draft

  const [editResults, setEditResults] = useState<Record<string, { actual_value: string; grade: string; result: string }>>(
    Object.fromEntries(results.map(r => [r.id, { actual_value: r.actual_value || '', grade: r.grade || '', result: r.result }]))
  )
  const [saving, setSaving] = useState(false)
  const [statusLoading, setStatusLoading] = useState('')

  const passCount = results.filter(r => (editResults[r.id]?.result || r.result) === 'pass').length
  const failCount = results.filter(r => (editResults[r.id]?.result || r.result) === 'fail').length
  const pendingCount = results.filter(r => (editResults[r.id]?.result || r.result) === 'pending').length

  const handleStatusChange = async (status: string) => {
    setStatusLoading(status)
    const result = await updateTestRequestStatus(request.id, status)
    setStatusLoading('')
    if (result.success) toast.success(`Status updated to ${status.replace(/_/g, ' ')}`)
    else toast.error('Failed', { description: result.error })
  }

  const handleSaveResults = async () => {
    setSaving(true)
    const data = Object.entries(editResults).map(([id, vals]) => ({ id, ...vals }))
    const result = await saveTestResults(request.id, data)
    setSaving(false)
    if (result.success) toast.success('Results saved')
    else toast.error('Failed', { description: result.error })
  }

  const updateResult = (id: string, field: string, value: string) => {
    setEditResults(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  return (
    <div>
      <Link href="/testing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Testing
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{request.request_number}</h1>
            <Badge style={{ backgroundColor: catCfg.bg, color: catCfg.color }}>{catCfg.label}</Badge>
            <Badge style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</Badge>
            {request.overall_result && (
              <Badge className={cn('text-[10px]', request.overall_result === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                {request.overall_result === 'pass' ? 'PASS' : 'FAIL'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {[request.fabric_type, request.fabric_composition, request.lab_partners?.lab_name, request.buyer_standard].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Status actions */}
      {canManage && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {request.status === 'draft' && (
            <Button size="sm" className="text-xs gap-1" onClick={() => handleStatusChange('submitted_to_lab')} disabled={!!statusLoading}>
              {statusLoading === 'submitted_to_lab' ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Submit to Lab
            </Button>
          )}
          {request.status === 'submitted_to_lab' && (
            <Button size="sm" className="text-xs gap-1" onClick={() => handleStatusChange('in_testing')} disabled={!!statusLoading}>Mark In Testing</Button>
          )}
          {request.status === 'in_testing' && (
            <Button size="sm" className="text-xs gap-1" onClick={() => handleStatusChange('results_received')} disabled={!!statusLoading}>Results Received</Button>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold text-green-600">{passCount}</p><p className="text-[10px] text-muted-foreground">Pass</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold text-red-600">{failCount}</p><p className="text-[10px] text-muted-foreground">Fail</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold text-muted-foreground">{pendingCount}</p><p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
      </div>

      <Tabs defaultValue="results">
        <TabsList className="bg-muted/50 mb-4">
          <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Test</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Method</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Required</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Actual</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Grade</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map(r => {
                    const edited = editResults[r.id] || { actual_value: '', grade: '', result: 'pending' }
                    return (
                      <tr key={r.id} className={cn('hover:bg-muted/20', edited.result === 'pass' && 'bg-green-50/30', edited.result === 'fail' && 'bg-red-50/30')}>
                        <td className="px-3 py-2 font-medium">{r.test_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.test_method || '—'}</td>
                        <td className="px-3 py-2">{r.required_value || '—'} {r.unit && <span className="text-muted-foreground">{r.unit}</span>}</td>
                        <td className="px-3 py-2">
                          {canManage ? (
                            <input className="w-20 px-2 py-1 rounded border border-border bg-background text-xs" value={edited.actual_value} onChange={e => updateResult(r.id, 'actual_value', e.target.value)} placeholder="—" />
                          ) : (edited.actual_value || '—')}
                        </td>
                        <td className="px-3 py-2">
                          {canManage ? (
                            <input className="w-16 px-2 py-1 rounded border border-border bg-background text-xs" value={edited.grade} onChange={e => updateResult(r.id, 'grade', e.target.value)} placeholder="—" />
                          ) : (edited.grade || '—')}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {canManage ? (
                            <select className="px-2 py-1 rounded border border-border bg-background text-xs" value={edited.result} onChange={e => updateResult(r.id, 'result', e.target.value)}>
                              <option value="pending">Pending</option>
                              <option value="pass">Pass</option>
                              <option value="fail">Fail</option>
                              <option value="not_applicable">N/A</option>
                            </select>
                          ) : (
                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold',
                              edited.result === 'pass' ? 'bg-green-100 text-green-700' : edited.result === 'fail' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            )}>{edited.result}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {canManage && results.length > 0 && (
              <div className="p-3 border-t border-border">
                <Button size="sm" className="gap-1.5" onClick={handleSaveResults} disabled={saving} style={{ backgroundColor: '#D4A843' }}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Results
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="info">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-3">Request Details</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Project', request.projects?.name],
                ['Lab', request.lab_partners?.lab_name],
                ['Fabric', request.fabric_type],
                ['Composition', request.fabric_composition],
                ['Color', request.color],
                ['Buyer Standard', request.buyer_standard],
                ['Submitted', request.submitted_date],
                ['Expected Results', request.expected_result_date],
                ['Actual Results', request.actual_result_date],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value || '—'}</span>
                </div>
              ))}
            </div>
            {request.notes && <p className="text-xs text-muted-foreground mt-3">{request.notes}</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
