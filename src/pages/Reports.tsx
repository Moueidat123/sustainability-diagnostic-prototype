import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileBarChart, Printer, FileSpreadsheet, FileJson,
  CheckCircle2, AlertCircle,
} from 'lucide-react'
import { useLocalState } from '../lib/storage'
import {
  EMPTY_COMPANY, EMPTY_WORKFLOW, KEYS, STATUS_LABEL,
  type Company, type Site, type FuelEntry, type FleetEntry, type ElectricityEntry,
  type Workflow,
} from '../lib/types'
import {
  fuelEmissionsTons, fleetEmissionsTons, electricityEmissionsTons,
  findFuel, gridFactor, FUEL_FACTOR_VERSION, GRID_FACTOR_VERSION,
} from '../lib/emissionFactors'
import { sectorBenchmark } from '../lib/benchmarks'
import {
  EMPTY_ACCREDITATION, TIER_LABEL, scoreFor, suggestedTier,
  type AccreditationState,
} from '../lib/accreditation'
import { Button } from '../components/ui'

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
}
function fmtDate(ts?: number) {
  return ts ? new Date(ts).toLocaleString() : '—'
}

function downloadBlob(filename: string, mime: string, data: string) {
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map(r => r.map(c => {
    const s = String(c ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }).join(',')).join('\n')
}

export default function Reports() {
  const [company]     = useLocalState<Company>(KEYS.company, EMPTY_COMPANY)
  const [sites]       = useLocalState<Site[]>(KEYS.sites, [])
  const [fuels]       = useLocalState<FuelEntry[]>(KEYS.fuels, [])
  const [fleet]       = useLocalState<FleetEntry[]>(KEYS.fleet, [])
  const [electricity] = useLocalState<ElectricityEntry[]>(KEYS.electricity, [])
  const [wf]          = useLocalState<Workflow>(KEYS.workflow, EMPTY_WORKFLOW)
  const [acc]         = useLocalState<AccreditationState>(KEYS.accreditation, EMPTY_ACCREDITATION)

  // ----- calculations -----
  const siteName = (id: string) => sites.find(s => s.id === id)?.name ?? '—'

  const scope1Fuels = useMemo(
    () => fuels.reduce((s, e) => s + fuelEmissionsTons(e.fuelId, Number(e.quantity || 0)), 0),
    [fuels],
  )
  const scope1Fleet = useMemo(
    () => fleet.reduce((s, e) => s + fleetEmissionsTons(
      e.fuelId, e.mode, Number(e.quantity || 0), Number(e.kmDriven || 0), Number(e.consumptionPer100km || 0),
    ), 0),
    [fleet],
  )
  const elec = useMemo(() => {
    let g = 0, p = 0, o = 0, t = 0
    electricity.forEach(e => {
      const gk = Number(e.gridKwh || 0)
      g += gk
      p += Number(e.purchasedRenewableKwh || 0)
      o += Number(e.onsiteRenewableKwh || 0)
      t += electricityEmissionsTons(e.country, gk)
    })
    const total = g + p + o
    return { grid: g, purchased: p, onsite: o, total, tons: t, renewPct: total ? ((p + o) / total) * 100 : 0 }
  }, [electricity])

  const scope1Total = scope1Fuels + scope1Fleet
  const scope2Total = elec.tons
  const totalGHG = scope1Total + scope2Total
  const benchmark = sectorBenchmark(company.sector)

  const accScore = scoreFor(acc.answers)
  const proposed = suggestedTier(accScore.pct)

  // ----- export builders -----
  function exportCsv() {
    const blocks: (string | number)[][][] = []

    blocks.push([['COMPANY']])
    blocks.push([
      ['Field', 'Value'],
      ['Name', company.name],
      ['Legal entity', company.legalEntity],
      ['Sector', company.sector],
      ['Country', company.country],
      ['Reporting year', company.reportingYear],
      ['Contact', `${company.contactName} <${company.contactEmail}>`],
    ])

    blocks.push([[]])
    blocks.push([['SITES']])
    blocks.push([['Name', 'City', 'Country', 'Ownership', 'Floor area (m²)']])
    sites.forEach(s => blocks[blocks.length - 1].push([s.name, s.city, s.country, s.ownership, s.floorArea]))

    blocks.push([[]])
    blocks.push([['SCOPE 1 — FUELS']])
    blocks.push([['Site', 'Fuel', 'Unit', 'Quantity', 'Factor (kgCO2e/unit)', 'tCO2e']])
    fuels.forEach(e => {
      const f = findFuel(e.fuelId)
      blocks[blocks.length - 1].push([
        siteName(e.siteId), f?.label ?? e.fuelId, f?.unit ?? '', Number(e.quantity || 0),
        f?.kgCO2ePerUnit ?? 0, +fuelEmissionsTons(e.fuelId, Number(e.quantity || 0)).toFixed(4),
      ])
    })

    blocks.push([[]])
    blocks.push([['SCOPE 1 — FLEET']])
    blocks.push([['Site', 'Vehicle type', 'Fuel', 'Mode', 'Qty', 'km', 'L/100km', 'tCO2e']])
    fleet.forEach(e => {
      const f = findFuel(e.fuelId)
      blocks[blocks.length - 1].push([
        siteName(e.siteId), e.vehicleType, f?.label ?? e.fuelId, e.mode,
        Number(e.quantity || 0), Number(e.kmDriven || 0), Number(e.consumptionPer100km || 0),
        +fleetEmissionsTons(e.fuelId, e.mode, Number(e.quantity || 0), Number(e.kmDriven || 0), Number(e.consumptionPer100km || 0)).toFixed(4),
      ])
    })

    blocks.push([[]])
    blocks.push([['SCOPE 2 — ELECTRICITY']])
    blocks.push([['Site', 'Country', 'Grid kWh', 'Purchased renewable kWh', 'On-site renewable kWh', 'Grid factor (kgCO2e/kWh)', 'tCO2e']])
    electricity.forEach(e => {
      blocks[blocks.length - 1].push([
        siteName(e.siteId), e.country,
        Number(e.gridKwh || 0), Number(e.purchasedRenewableKwh || 0), Number(e.onsiteRenewableKwh || 0),
        gridFactor(e.country), +electricityEmissionsTons(e.country, Number(e.gridKwh || 0)).toFixed(4),
      ])
    })

    blocks.push([[]])
    blocks.push([['TOTALS']])
    blocks.push([
      ['Scope 1 — Fuels (tCO2e)', +scope1Fuels.toFixed(4)],
      ['Scope 1 — Fleet (tCO2e)', +scope1Fleet.toFixed(4)],
      ['Scope 2 — Electricity (tCO2e)', +scope2Total.toFixed(4)],
      ['Total GHG (tCO2e)', +totalGHG.toFixed(4)],
      ['Sector benchmark (tCO2e)', benchmark],
      ['Renewable electricity %', +elec.renewPct.toFixed(2)],
    ])

    const csv = blocks.map(b => toCsv(b)).join('\n')
    const slug = (company.name || 'diagnostic').replace(/[^a-z0-9]+/gi, '_').toLowerCase()
    downloadBlob(`${slug}_${company.reportingYear || ''}_report.csv`, 'text/csv;charset=utf-8', csv)
  }

  function exportJson() {
    const payload = {
      generatedAt: new Date().toISOString(),
      factorVersions: { fuels: FUEL_FACTOR_VERSION, grid: GRID_FACTOR_VERSION },
      company, sites, fuels, fleet, electricity,
      workflow: wf, accreditation: acc,
      totals: {
        scope1Fuels, scope1Fleet, scope2: scope2Total, total: totalGHG,
        renewablePct: elec.renewPct, sectorBenchmark: benchmark,
      },
    }
    const slug = (company.name || 'diagnostic').replace(/[^a-z0-9]+/gi, '_').toLowerCase()
    downloadBlob(`${slug}_${company.reportingYear || ''}_export.json`, 'application/json', JSON.stringify(payload, null, 2))
  }

  function printReport() {
    window.print()
  }

  const readyChecks = [
    { label: 'Company profile', ok: !!company.name && !!company.sector },
    { label: 'At least one site', ok: sites.length > 0 },
    { label: 'Emissions data entered', ok: fuels.length + fleet.length + electricity.length > 0 },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header (hidden in print) */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
            <FileBarChart size={14} /> Reports & Export
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">
            Diagnostic report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate a printable PDF or download the full diagnostic dataset.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportCsv}>
            <FileSpreadsheet size={14} /> Excel-ready CSV
          </Button>
          <Button variant="secondary" onClick={exportJson}>
            <FileJson size={14} /> JSON
          </Button>
          <Button onClick={printReport}>
            <Printer size={14} /> Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Readiness banner (hidden in print) */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 print:hidden">
        <div className="flex flex-wrap gap-3 items-center">
          {readyChecks.map(c => (
            <div key={c.label} className="flex items-center gap-1.5 text-xs">
              {c.ok
                ? <CheckCircle2 size={14} className="text-emerald-600" />
                : <AlertCircle size={14} className="text-amber-500" />}
              <span className={c.ok ? 'text-slate-700' : 'text-slate-500'}>{c.label}</span>
            </div>
          ))}
          {!readyChecks.every(c => c.ok) && (
            <div className="text-[11px] text-slate-500 ml-2">
              You can still print/export, but some sections may be empty. Complete data via the{' '}
              <Link to="/" className="text-brand-700 underline">Dashboard</Link>.
            </div>
          )}
        </div>
      </section>

      {/* PRINTABLE REPORT */}
      <div className="print-area space-y-6">
        {/* Cover */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 print:border-0 print:rounded-none">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-brand-700">Aramco Taleed</div>
              <h2 className="text-2xl font-semibold text-slate-900 mt-1">
                {company.name || 'Sustainability Diagnostic Report'}
              </h2>
              <div className="text-sm text-slate-600 mt-1">
                Reporting year {company.reportingYear || '—'} · {company.sector || 'Sector not set'} · {company.country || 'Country not set'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Generated {new Date().toLocaleString()} · Status: <strong>{STATUS_LABEL[wf.status]}</strong>
                {acc.assignedTier !== 'none' && <> · Tier: <strong>{TIER_LABEL[acc.assignedTier]}</strong></>}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Factor sources:</div>
              <div className="text-slate-700">{FUEL_FACTOR_VERSION}</div>
              <div className="text-slate-700">{GRID_FACTOR_VERSION}</div>
            </div>
          </div>
        </section>

        {/* Executive summary */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 print:border-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Executive summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: 'Total GHG (tCO₂e)', v: totalGHG > 0 ? fmt(totalGHG) : '—' },
              { l: 'Scope 1 (tCO₂e)',   v: scope1Total > 0 ? fmt(scope1Total) : '—' },
              { l: 'Scope 2 (tCO₂e)',   v: scope2Total > 0 ? fmt(scope2Total) : '—' },
              { l: 'Renewable elec %',  v: elec.total > 0 ? `${fmt(elec.renewPct, 1)}%` : '—' },
            ].map(k => (
              <div key={k.l} className="border border-slate-200 rounded-md p-3">
                <div className="text-[11px] text-slate-500">{k.l}</div>
                <div className="text-lg font-semibold text-slate-900 tabular-nums">{k.v}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-600 mt-3">
            {company.sector && totalGHG > 0 && (
              <>Sector benchmark for <strong>{company.sector}</strong>: ~{benchmark} tCO₂e/year ·{' '}
              {totalGHG < benchmark
                ? <>You are <strong>{Math.round((1 - totalGHG / benchmark) * 100)}% below</strong> the sector average.</>
                : <>You are <strong>{Math.round((totalGHG / benchmark - 1) * 100)}% above</strong> the sector average.</>}</>
            )}
          </div>
        </section>

        {/* Sites */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 print:border-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Sites ({sites.length})</h3>
          {sites.length === 0 ? <div className="text-xs text-slate-400 italic">No sites recorded.</div> : (
            <table className="w-full text-xs">
              <thead className="text-slate-500"><tr>
                <th className="text-left py-1">Name</th><th className="text-left">City</th>
                <th className="text-left">Country</th><th className="text-left">Ownership</th>
                <th className="text-right">Floor area (m²)</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {sites.map(s => (
                  <tr key={s.id}>
                    <td className="py-1.5 text-slate-800">{s.name}</td>
                    <td>{s.city}</td><td>{s.country}</td><td>{s.ownership}</td>
                    <td className="text-right tabular-nums">{s.floorArea || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Scope 1 — Fuels */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 print:border-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Scope 1 — Fuels ({fmt(scope1Fuels)} tCO₂e)
          </h3>
          {fuels.length === 0 ? <div className="text-xs text-slate-400 italic">No fuel entries.</div> : (
            <table className="w-full text-xs">
              <thead className="text-slate-500"><tr>
                <th className="text-left py-1">Site</th><th className="text-left">Fuel</th>
                <th className="text-right">Quantity</th><th className="text-right">Factor</th>
                <th className="text-right">tCO₂e</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {fuels.map(e => {
                  const f = findFuel(e.fuelId)
                  const t = fuelEmissionsTons(e.fuelId, Number(e.quantity || 0))
                  return (
                    <tr key={e.id}>
                      <td className="py-1.5 text-slate-800">{siteName(e.siteId)}</td>
                      <td>{f?.label ?? e.fuelId}</td>
                      <td className="text-right tabular-nums">{Number(e.quantity || 0)} {f?.unit}</td>
                      <td className="text-right tabular-nums">{f?.kgCO2ePerUnit}</td>
                      <td className="text-right tabular-nums font-medium">{fmt(t, 3)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Scope 1 — Fleet */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 print:border-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Scope 1 — Fleet ({fmt(scope1Fleet)} tCO₂e)
          </h3>
          {fleet.length === 0 ? <div className="text-xs text-slate-400 italic">No fleet entries.</div> : (
            <table className="w-full text-xs">
              <thead className="text-slate-500"><tr>
                <th className="text-left py-1">Site</th><th className="text-left">Vehicle</th>
                <th className="text-left">Fuel</th><th className="text-left">Mode</th>
                <th className="text-right">km</th><th className="text-right">L/100km</th>
                <th className="text-right">tCO₂e</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {fleet.map(e => {
                  const f = findFuel(e.fuelId)
                  const t = fleetEmissionsTons(e.fuelId, e.mode, Number(e.quantity || 0), Number(e.kmDriven || 0), Number(e.consumptionPer100km || 0))
                  return (
                    <tr key={e.id}>
                      <td className="py-1.5 text-slate-800">{siteName(e.siteId)}</td>
                      <td>{e.vehicleType}</td>
                      <td>{f?.label ?? e.fuelId}</td>
                      <td>{e.mode}</td>
                      <td className="text-right tabular-nums">{Number(e.kmDriven || 0) || '—'}</td>
                      <td className="text-right tabular-nums">{Number(e.consumptionPer100km || 0) || '—'}</td>
                      <td className="text-right tabular-nums font-medium">{fmt(t, 3)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Scope 2 */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 print:border-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Scope 2 — Electricity ({fmt(scope2Total)} tCO₂e · {fmt(elec.renewPct, 1)}% renewable)
          </h3>
          {electricity.length === 0 ? <div className="text-xs text-slate-400 italic">No electricity entries.</div> : (
            <table className="w-full text-xs">
              <thead className="text-slate-500"><tr>
                <th className="text-left py-1">Site</th><th className="text-left">Country</th>
                <th className="text-right">Grid kWh</th><th className="text-right">Renewable kWh</th>
                <th className="text-right">Factor</th><th className="text-right">tCO₂e</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {electricity.map(e => {
                  const renew = Number(e.purchasedRenewableKwh || 0) + Number(e.onsiteRenewableKwh || 0)
                  const t = electricityEmissionsTons(e.country, Number(e.gridKwh || 0))
                  return (
                    <tr key={e.id}>
                      <td className="py-1.5 text-slate-800">{siteName(e.siteId)}</td>
                      <td>{e.country}</td>
                      <td className="text-right tabular-nums">{Number(e.gridKwh || 0)}</td>
                      <td className="text-right tabular-nums text-emerald-700">{renew || '—'}</td>
                      <td className="text-right tabular-nums">{gridFactor(e.country)}</td>
                      <td className="text-right tabular-nums font-medium">{fmt(t, 3)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Workflow + Accreditation */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 print:border-0">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Workflow</h3>
            <div className="text-xs space-y-1 text-slate-700">
              <div>Status: <strong>{STATUS_LABEL[wf.status]}</strong></div>
              <div>Submitted: {fmtDate(wf.submittedAt)}</div>
              <div>Approved: {fmtDate(wf.approvedAt)}</div>
              <div>Comments: {wf.comments.length} ({wf.comments.filter(c => !c.resolved).length} open)</div>
              <div>Events logged: {wf.events.length}</div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 print:border-0">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Accreditation</h3>
            <div className="text-xs space-y-1 text-slate-700">
              <div>Checklist: <strong>{accScore.earned} / {accScore.possible} pts</strong> ({accScore.pct.toFixed(0)}%)</div>
              <div>Suggested tier: <strong>{TIER_LABEL[proposed]}</strong></div>
              <div>Assigned tier: <strong>{TIER_LABEL[acc.assignedTier]}</strong>{acc.assignedAt && <> · {fmtDate(acc.assignedAt)}</>}</div>
              <div>Published: {acc.published ? <span className="text-emerald-700">Yes</span> : 'No'}</div>
              {acc.pmNote && <div className="italic text-slate-600 mt-1">"{acc.pmNote}"</div>}
            </div>
          </div>
        </section>

        <div className="text-[10px] text-slate-400 text-center print:mt-6">
          Generated by the Sustainability Diagnostic & Partner Accreditation Platform · Prototype
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body { background: white !important; }
          aside, header, nav, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; background: white !important; }
          .print-area { gap: 0 !important; }
          .print-area section { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; border: 0 !important; padding: 0 0 12px 0 !important; margin-bottom: 12px !important; border-bottom: 1px solid #e2e8f0 !important; border-radius: 0 !important; }
          table { font-size: 10px !important; }
        }
      `}</style>
    </div>
  )
}
