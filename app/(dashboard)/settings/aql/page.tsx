'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Calculator, BookOpen, Table2 } from 'lucide-react'

const LOT_SIZE_TABLE = [
  { range: '2 – 8', l1: 'A', l2: 'A', l3: 'B' },
  { range: '9 – 15', l1: 'A', l2: 'B', l3: 'C' },
  { range: '16 – 25', l1: 'B', l2: 'C', l3: 'D' },
  { range: '26 – 50', l1: 'C', l2: 'D', l3: 'E' },
  { range: '51 – 90', l1: 'C', l2: 'E', l3: 'F' },
  { range: '91 – 150', l1: 'D', l2: 'F', l3: 'G' },
  { range: '151 – 280', l1: 'E', l2: 'G', l3: 'H' },
  { range: '281 – 500', l1: 'F', l2: 'H', l3: 'J' },
  { range: '501 – 1,200', l1: 'G', l2: 'J', l3: 'K' },
  { range: '1,201 – 3,200', l1: 'H', l2: 'K', l3: 'L' },
  { range: '3,201 – 10,000', l1: 'J', l2: 'L', l3: 'M' },
  { range: '10,001 – 35,000', l1: 'K', l2: 'M', l3: 'N' },
  { range: '35,001 – 150,000', l1: 'L', l2: 'N', l3: 'P' },
  { range: '150,001 – 500,000', l1: 'M', l2: 'P', l3: 'Q' },
  { range: '500,001+', l1: 'N', l2: 'Q', l3: 'R' },
]

const CODE_SAMPLE_TABLE = [
  { code: 'A', sample: 2 }, { code: 'B', sample: 3 }, { code: 'C', sample: 5 },
  { code: 'D', sample: 8 }, { code: 'E', sample: 13 }, { code: 'F', sample: 20 },
  { code: 'G', sample: 32 }, { code: 'H', sample: 50 }, { code: 'J', sample: 80 },
  { code: 'K', sample: 125 }, { code: 'L', sample: 200 }, { code: 'M', sample: 315 },
  { code: 'N', sample: 500 }, { code: 'P', sample: 800 }, { code: 'Q', sample: 1250 },
  { code: 'R', sample: 2000 },
]

const ACCEPTANCE_TABLE: { sample: number; aql10: [number, number] | null; aql25: [number, number] | null; aql40: [number, number] | null }[] = [
  { sample: 2, aql10: null, aql25: null, aql40: null },
  { sample: 3, aql10: null, aql25: null, aql40: [0, 1] },
  { sample: 5, aql10: [0, 1], aql25: null, aql40: [0, 1] },
  { sample: 8, aql10: [0, 1], aql25: [0, 1], aql40: [1, 2] },
  { sample: 13, aql10: [0, 1], aql25: [1, 2], aql40: [1, 2] },
  { sample: 20, aql10: [0, 1], aql25: [1, 2], aql40: [2, 3] },
  { sample: 32, aql10: [1, 2], aql25: [2, 3], aql40: [3, 4] },
  { sample: 50, aql10: [1, 2], aql25: [3, 4], aql40: [5, 6] },
  { sample: 80, aql10: [2, 3], aql25: [5, 6], aql40: [7, 8] },
  { sample: 125, aql10: [3, 4], aql25: [7, 8], aql40: [10, 11] },
  { sample: 200, aql10: [5, 6], aql25: [10, 11], aql40: [14, 15] },
  { sample: 315, aql10: [7, 8], aql25: [14, 15], aql40: [21, 22] },
  { sample: 500, aql10: [10, 11], aql25: [21, 22], aql40: null },
  { sample: 800, aql10: [14, 15], aql25: [21, 22], aql40: null },
  { sample: 1250, aql10: [21, 22], aql25: [21, 22], aql40: null },
  { sample: 2000, aql10: [21, 22], aql25: null, aql40: null },
]

const COMMON_SCENARIOS = [
  { lot: '350', level: 'II', code: 'H', sample: 50, major: '3/4', minor: '5/6' },
  { lot: '800', level: 'II', code: 'J', sample: 80, major: '5/6', minor: '7/8' },
  { lot: '1,500', level: 'II', code: 'K', sample: 125, major: '7/8', minor: '10/11' },
  { lot: '5,000', level: 'II', code: 'L', sample: 200, major: '10/11', minor: '14/15' },
  { lot: '15,000', level: 'II', code: 'M', sample: 315, major: '14/15', minor: '21/22' },
  { lot: '800', level: 'III', code: 'K', sample: 125, major: '7/8', minor: '10/11' },
]

export default function AQLTablePage() {
  const [lotSize, setLotSize] = useState('')
  const [inspLevel, setInspLevel] = useState<'1' | '2' | '3'>('2')
  const [calcResult, setCalcResult] = useState<{
    code: string; sample: number
    major: { ac: number; re: number }
    minor: { ac: number; re: number }
  } | null>(null)

  const calculate = () => {
    const lot = parseInt(lotSize.replace(/,/g, ''), 10)
    if (!lot || lot < 2) return

    const ranges: [number, number][] = [
      [2, 8], [9, 15], [16, 25], [26, 50], [51, 90], [91, 150],
      [151, 280], [281, 500], [501, 1200], [1201, 3200],
      [3201, 10000], [10001, 35000], [35001, 150000],
      [150001, 500000], [500001, 999999999]
    ]
    const lotIdx = ranges.findIndex(([min, max]) => lot >= min && lot <= max)
    if (lotIdx < 0) return

    const row = LOT_SIZE_TABLE[lotIdx]
    const code = inspLevel === '1' ? row.l1 : inspLevel === '3' ? row.l3 : row.l2
    const sampleRow = CODE_SAMPLE_TABLE.find(r => r.code === code)
    if (!sampleRow) return

    const limitsRow = ACCEPTANCE_TABLE.find(r => r.sample === sampleRow.sample)
    if (!limitsRow) return

    setCalcResult({
      code,
      sample: sampleRow.sample,
      major: limitsRow.aql25 ? { ac: limitsRow.aql25[0], re: limitsRow.aql25[1] } : { ac: -1, re: -1 },
      minor: limitsRow.aql40 ? { ac: limitsRow.aql40[0], re: limitsRow.aql40[1] } : { ac: -1, re: -1 },
    })
  }

  const formatCell = (val: [number, number] | null) => {
    if (!val) return <span className="text-muted-foreground/30 text-xs">↑</span>
    return <span>{val[0]} / {val[1]}</span>
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Table2 className="w-5 h-5 text-primary" /> AQL Reference Table
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          ANSI / ASQ Z1.4 — Sampling Procedures and Tables for Inspection by Attributes
        </p>
      </div>

      {/* Severity legend */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Critical', aql: 'Zero Tolerance (0.0)', action: 'HALT — Do not ship', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-900/40', color: 'text-red-700 dark:text-red-400' },
          { label: 'Major', aql: 'AQL 2.5', action: 'Rework or reject lot', bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-900/40', color: 'text-orange-700 dark:text-orange-400' },
          { label: 'Minor', aql: 'AQL 4.0', action: 'Conditional accept', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/40', color: 'text-amber-700 dark:text-amber-400' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg border p-3 ${item.bg} ${item.border}`}>
            <p className={`font-semibold text-sm ${item.color}`}>{item.label}</p>
            <p className="text-xs mt-0.5 font-mono text-muted-foreground">{item.aql}</p>
            <p className="text-xs mt-1 text-muted-foreground">{item.action}</p>
          </div>
        ))}
      </div>

      {/* AQL Calculator */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground">AQL Calculator</h3>
          <span className="text-xs text-muted-foreground">Enter lot size to get sample size and accept/reject limits</span>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <Label className="text-xs mb-1 block">Lot Size</Label>
            <Input placeholder="e.g. 1500" value={lotSize} onChange={e => setLotSize(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calculate()} className="w-36 h-9" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Inspection Level</Label>
            <Select value={inspLevel} onValueChange={v => setInspLevel(v as '1' | '2' | '3')}>
              <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Level I — Reduced</SelectItem>
                <SelectItem value="2">Level II — Normal ★</SelectItem>
                <SelectItem value="3">Level III — Tightened</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={calculate} size="sm" className="h-9">Calculate</Button>
        </div>

        {calcResult && (
          <div className="mt-4 p-4 rounded-lg bg-muted/40 border border-border">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Code Letter</p>
                <p className="text-2xl font-bold text-foreground">{calcResult.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sample Size</p>
                <p className="text-2xl font-bold text-foreground">{calcResult.sample}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Major (AQL 2.5)</p>
                <p className="text-xl font-bold text-orange-700 dark:text-orange-400">
                  {calcResult.major.ac >= 0 ? `${calcResult.major.ac} / ${calcResult.major.re}` : '↑ see table'}
                </p>
                <p className="text-xs text-muted-foreground">Accept / Reject</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Minor (AQL 4.0)</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                  {calcResult.minor.ac >= 0 ? `${calcResult.minor.ac} / ${calcResult.minor.re}` : '↑ see table'}
                </p>
                <p className="text-xs text-muted-foreground">Accept / Reject</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded p-2 border border-red-100 dark:border-red-900/40">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Critical defects = Zero Tolerance. Any critical defect found = automatic FAIL. HALT inspection immediately.</span>
            </div>
          </div>
        )}
      </div>

      {/* Common Scenarios */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Common Apparel Inspection Scenarios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Lot Size</th>
                <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Level</th>
                <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Code</th>
                <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Sample</th>
                <th className="text-left px-4 py-2.5 text-xs text-orange-600 font-medium">Major (2.5)</th>
                <th className="text-left px-4 py-2.5 text-xs text-amber-600 font-medium">Minor (4.0)</th>
                <th className="text-left px-4 py-2.5 text-xs text-red-600 font-medium">Critical</th>
              </tr>
            </thead>
            <tbody>
              {COMMON_SCENARIOS.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.lot}</td>
                  <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs">Level {row.level}</Badge></td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{row.code}</td>
                  <td className="px-4 py-2.5 font-semibold text-foreground">{row.sample}</td>
                  <td className="px-4 py-2.5 text-orange-700 dark:text-orange-400 font-medium">{row.major}</td>
                  <td className="px-4 py-2.5 text-amber-700 dark:text-amber-400 font-medium">{row.minor}</td>
                  <td className="px-4 py-2.5 text-red-700 dark:text-red-400 font-medium">0 / 1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Acceptance Limits */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">Full Acceptance Limits Table</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Ac = Accept if defects ≤ · Re = Reject if defects ≥ · ↑ = Use arrow rule</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Sample</th>
                <th className="text-center px-4 py-2.5 text-xs text-muted-foreground font-medium">AQL 1.0</th>
                <th className="text-center px-4 py-2.5 text-xs text-orange-600 font-medium">AQL 2.5 — Major</th>
                <th className="text-center px-4 py-2.5 text-xs text-amber-600 font-medium">AQL 4.0 — Minor</th>
              </tr>
            </thead>
            <tbody>
              {ACCEPTANCE_TABLE.map((row, i) => {
                const isCommon = row.sample >= 50 && row.sample <= 315
                return (
                  <tr key={i} className={`border-b border-border last:border-0 ${isCommon ? 'bg-amber-50/30 dark:bg-amber-950/10' : 'hover:bg-accent/30'}`}>
                    <td className="px-4 py-2.5 font-semibold text-foreground">
                      {row.sample}
                      {isCommon && <span className="ml-2 text-xs text-amber-600 font-normal">common</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono text-sm">{formatCell(row.aql10)}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-sm text-orange-700 dark:text-orange-400">{formatCell(row.aql25)}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-sm text-amber-700 dark:text-amber-400">{formatCell(row.aql40)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lot Size → Code Letter */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">Lot Size → Code Letter</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Level II is the default for all standard inspections</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Lot Size Range</th>
                <th className="text-center px-4 py-2.5 text-xs text-muted-foreground font-medium">Level I</th>
                <th className="text-center px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400 font-medium">Level II ★</th>
                <th className="text-center px-4 py-2.5 text-xs text-muted-foreground font-medium">Level III</th>
              </tr>
            </thead>
            <tbody>
              {LOT_SIZE_TABLE.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.range}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-muted-foreground">{row.l1}</td>
                  <td className="px-4 py-2.5 text-center font-mono font-bold text-amber-700 dark:text-amber-400">{row.l2}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-muted-foreground">{row.l3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Standard: ANSI / ASQ Z1.4 — Sampling Procedures and Tables for Inspection by Attributes.
        Default: Level II Normal inspection. Switch to Level III after 2 consecutive FAIL results.
      </p>
    </div>
  )
}
