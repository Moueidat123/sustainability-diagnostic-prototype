import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Zap, MapPin, Info, Leaf } from 'lucide-react'
import { Button, Card, Field, Input, Modal, Select, Textarea, Toast } from '../components/ui'
import { useLocalState, uid } from '../lib/storage'
import { KEYS, type ElectricityEntry, type Site } from '../lib/types'
import { COUNTRIES } from '../lib/masterData'
import {
  GRID_FACTORS, GRID_FACTOR_VERSION,
  electricityEmissionsTons, gridFactor,
} from '../lib/emissionFactors'

const EMPTY: ElectricityEntry = {
  id: '', siteId: '', country: '',
  gridKwh: '', purchasedRenewableKwh: '', onsiteRenewableKwh: '',
  note: '',
}

type Errors = Partial<Record<keyof ElectricityEntry, string>>

function validate(e: ElectricityEntry, sitesExist: boolean): Errors {
  const errs: Errors = {}
  if (!sitesExist)        errs.siteId  = 'Add at least one site first'
  else if (!e.siteId)     errs.siteId  = 'Required'
  if (!e.country)         errs.country = 'Required'

  const g = Number(e.gridKwh || 0)
  const p = Number(e.purchasedRenewableKwh || 0)
  const o = Number(e.onsiteRenewableKwh || 0)
  if (g < 0) errs.gridKwh = 'Must be ≥ 0'
  if (p < 0) errs.purchasedRenewableKwh = 'Must be ≥ 0'
  if (o < 0) errs.onsiteRenewableKwh = 'Must be ≥ 0'
  if (g + p + o <= 0) errs.gridKwh = errs.gridKwh ?? 'Enter at least one consumption value'
  return errs
}

function fmt(n: number, digits = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export default function Scope2Electricity() {
  const [sites] = useLocalState<Site[]>(KEYS.sites, [])
  const [entries, setEntries] = useLocalState<ElectricityEntry[]>(KEYS.electricity, [])
  const [editing, setEditing] = useState<ElectricityEntry | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  const errors = useMemo(
    () => editing ? validate(editing, sites.length > 0) : {},
    [editing, sites.length]
  )

  // Company-wide aggregates
  const totals = useMemo(() => {
    let grid = 0, purchased = 0, onsite = 0, tons = 0
    entries.forEach(e => {
      const g = Number(e.gridKwh || 0)
      const p = Number(e.purchasedRenewableKwh || 0)
      const o = Number(e.onsiteRenewableKwh || 0)
      grid += g; purchased += p; onsite += o
      tons += electricityEmissionsTons(e.country, g)
    })
    const totalKwh = grid + purchased + onsite
    const renewablePct = totalKwh > 0 ? ((purchased + onsite) / totalKwh) * 100 : 0
    return { grid, purchased, onsite, totalKwh, tons, renewablePct }
  }, [entries])

  const perSiteTons = useMemo(() => {
    const m = new Map<string, number>()
    entries.forEach(e => {
      const t = electricityEmissionsTons(e.country, Number(e.gridKwh || 0))
      m.set(e.siteId, (m.get(e.siteId) ?? 0) + t)
    })
    return m
  }, [entries])

  const openAdd = () => {
    const firstSite = sites[0]
    setTouched({})
    setEditing({ ...EMPTY, id: uid(), siteId: firstSite?.id ?? '', country: firstSite?.country ?? '' })
  }
  const openEdit = (e: ElectricityEntry) => { setTouched({}); setEditing({ ...e }) }
  const close    = () => setEditing(null)

  const save = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!editing) return
    setTouched(Object.fromEntries(Object.keys(editing).map(k => [k, true])))
    if (Object.keys(errors).length > 0) return
    setEntries(list => {
      const exists = list.some(e => e.id === editing.id)
      return exists ? list.map(e => e.id === editing.id ? editing : e) : [...list, editing]
    })
    setToast('Electricity entry saved.')
    setTimeout(() => setToast(null), 2000)
    close()
  }

  const remove = (id: string) => {
    if (!confirm('Delete this electricity entry?')) return
    setEntries(list => list.filter(e => e.id !== id))
    setToast('Entry deleted.')
    setTimeout(() => setToast(null), 2000)
  }

  const err = (k: keyof ElectricityEntry) => (touched[k] ? errors[k] : undefined)
  const ok  = (k: keyof ElectricityEntry) => !!editing && !errors[k] && String(editing[k] ?? '').trim() !== ''
  const set = <K extends keyof ElectricityEntry>(k: K, v: ElectricityEntry[K]) =>
    setEditing(s => s ? { ...s, [k]: v } : s)

  // Auto-update country when site changes
  const onSiteChange = (siteId: string) => {
    const site = sites.find(s => s.id === siteId)
    setEditing(s => s ? { ...s, siteId, country: site?.country ?? s.country } : s)
  }

  // Live preview values
  const previewTons = editing
    ? electricityEmissionsTons(editing.country, Number(editing.gridKwh || 0))
    : 0
  const previewFactor = editing ? gridFactor(editing.country) : 0
  const previewTotalKwh = editing
    ? Number(editing.gridKwh || 0) + Number(editing.purchasedRenewableKwh || 0) + Number(editing.onsiteRenewableKwh || 0)
    : 0
  const previewRenewPct = editing && previewTotalKwh > 0
    ? ((Number(editing.purchasedRenewableKwh || 0) + Number(editing.onsiteRenewableKwh || 0)) / previewTotalKwh) * 100
    : 0

  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Scope 2 – Electricity</h1>
          <p className="mt-1 text-sm text-slate-600">
            Purchased and self-generated electricity per site (FR-007). Grid kWh is converted to tCO₂e using country-specific factors; renewable kWh counts as zero-emission.
          </p>
        </div>
        <Button onClick={openAdd} disabled={sites.length === 0}>
          <Plus size={16} /> Add electricity entry
        </Button>
      </header>

      {/* Empty state — no sites */}
      {sites.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mb-3">
              <MapPin size={20} />
            </div>
            <p className="text-sm text-slate-700 font-medium">You need at least one site before adding electricity data.</p>
            <p className="text-xs text-slate-500 mt-1">Electricity is recorded per site so emissions can be summarised per location.</p>
            <Link to="/sites" className="inline-block mt-4">
              <Button variant="primary"><MapPin size={16} /> Go to Sites</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* KPI strip */}
      {sites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500">Total Scope 2</div>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {fmt(totals.tons)} <span className="text-sm font-normal text-slate-500">tCO₂e</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">From {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500">Total electricity</div>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {fmt(totals.totalKwh, 0)} <span className="text-sm font-normal text-slate-500">kWh</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Grid + purchased + on-site</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Leaf size={12} className="text-emerald-600" /> Renewable %</div>
            <div className="text-2xl font-semibold text-emerald-700 mt-1 tabular-nums">
              {fmt(totals.renewablePct, 1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Of total electricity (FR-013)</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Info size={12} /> Factor set</div>
            <div className="text-sm font-medium text-slate-800 mt-1">{GRID_FACTOR_VERSION}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">grid kWh × country factor ÷ 1000</div>
          </div>
        </div>
      )}

      {/* Renewable composition bar */}
      {sites.length > 0 && totals.totalKwh > 0 && (
        <Card title="Electricity composition" subtitle="Mix of grid vs purchased vs on-site renewable across all sites.">
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
            <div className="bg-slate-400"   style={{ width: `${(totals.grid      / totals.totalKwh) * 100}%` }} title="Grid" />
            <div className="bg-emerald-400" style={{ width: `${(totals.purchased / totals.totalKwh) * 100}%` }} title="Purchased renewable" />
            <div className="bg-emerald-600" style={{ width: `${(totals.onsite    / totals.totalKwh) * 100}%` }} title="On-site renewable" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
            <div><span className="inline-block w-2 h-2 rounded-full bg-slate-400 mr-1.5"></span>Grid: <span className="tabular-nums font-medium">{fmt(totals.grid, 0)} kWh</span></div>
            <div><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span>Purchased renewable: <span className="tabular-nums font-medium">{fmt(totals.purchased, 0)} kWh</span></div>
            <div><span className="inline-block w-2 h-2 rounded-full bg-emerald-600 mr-1.5"></span>On-site renewable: <span className="tabular-nums font-medium">{fmt(totals.onsite, 0)} kWh</span></div>
          </div>
        </Card>
      )}

      {/* Entries table */}
      {sites.length > 0 && (
        <Card title={`Electricity entries (${entries.length})`}>
          {entries.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 mb-3">
                <Zap size={20} />
              </div>
              <p className="text-sm text-slate-600">No electricity entries yet.</p>
              <p className="text-xs text-slate-400 mt-1">Click <strong>Add electricity entry</strong> to record consumption.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="text-left  font-medium px-5 py-2">Site</th>
                    <th className="text-left  font-medium px-3 py-2">Country</th>
                    <th className="text-right font-medium px-3 py-2">Grid (kWh)</th>
                    <th className="text-right font-medium px-3 py-2">Purchased renewable</th>
                    <th className="text-right font-medium px-3 py-2">On-site renewable</th>
                    <th className="text-right font-medium px-3 py-2">Factor</th>
                    <th className="text-right font-medium px-3 py-2">tCO₂e</th>
                    <th className="w-20 px-5 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => {
                    const site = sites.find(s => s.id === e.siteId)
                    const t = electricityEmissionsTons(e.country, Number(e.gridKwh || 0))
                    return (
                      <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {site?.name ?? <span className="text-red-600 text-xs">Site missing</span>}
                        </td>
                        <td className="px-3 py-3 text-slate-700">{e.country}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                          {e.gridKwh === '' ? '—' : Number(e.gridKwh).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-emerald-700">
                          {e.purchasedRenewableKwh === '' ? '—' : Number(e.purchasedRenewableKwh).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-emerald-700">
                          {e.onsiteRenewableKwh === '' ? '—' : Number(e.onsiteRenewableKwh).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-slate-500 tabular-nums">
                          {gridFactor(e.country).toFixed(3)}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums font-semibold text-brand-700">
                          {fmt(t)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => openEdit(e)} className="text-slate-500 hover:text-brand-700 p-1" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => remove(e.id)} className="text-slate-500 hover:text-red-600 p-1 ml-1" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-brand-700">{fmt(totals.tons)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Per-site breakdown */}
      {sites.length > 0 && entries.length > 0 && (
        <Card title="Per-site Scope 2 totals">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sites.map(s => {
              const t = perSiteTons.get(s.id) ?? 0
              const pct = totals.tons > 0 ? (t / totals.tons) * 100 : 0
              return (
                <div key={s.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-900 truncate">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.city}</div>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-900 tabular-nums">
                    {fmt(t)} <span className="text-xs font-normal text-slate-500">tCO₂e</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={!!editing}
        onClose={close}
        title={editing && entries.some(e => e.id === editing.id) ? 'Edit electricity entry' : 'Add electricity entry'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={close}>Cancel</Button>
            <Button type="submit" form="elec-form">Save entry</Button>
          </>
        }
      >
        {editing && (
          <form id="elec-form" onSubmit={save} noValidate className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Site" required error={err('siteId')} valid={ok('siteId')}
                     tooltip="The location this electricity was consumed at. Selecting it auto-fills the country below.">
                <Select value={editing.siteId} invalid={!!err('siteId')} valid={ok('siteId')}
                        onChange={e => onSiteChange(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, siteId: true }))}>
                  <option value="">Select site…</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
                </Select>
              </Field>

              <Field label="Country (for grid factor)" required error={err('country')} valid={ok('country')}
                     hint={`Factor: ${previewFactor.toFixed(3)} kgCO₂e/kWh`}
                     tooltip="Determines the grid emission factor applied to grid kWh. Defaults from the selected site's country.">
                <Select value={editing.country} invalid={!!err('country')} valid={ok('country')}
                        onChange={e => set('country', e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, country: true }))}>
                  <option value="">Select country…</option>
                  {COUNTRIES.filter(c => c in GRID_FACTORS || c === 'Other').map(c => (
                    <option key={c} value={c}>{c} ({(GRID_FACTORS[c] ?? GRID_FACTORS['Other']).toFixed(3)})</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Grid electricity (kWh)" error={err('gridKwh')} hint="Non-renewable / supplier mix"
                     valid={!!editing && !errors.gridKwh && editing.gridKwh !== ''}
                     tooltip="Electricity drawn from the public grid. This is what generates Scope 2 emissions.">
                <Input type="number" min={0} step="any"
                       value={editing.gridKwh} invalid={!!err('gridKwh')}
                       valid={!!editing && !errors.gridKwh && editing.gridKwh !== ''}
                       onChange={e => set('gridKwh', e.target.value === '' ? '' : Number(e.target.value))}
                       onBlur={() => setTouched(t => ({ ...t, gridKwh: true }))} />
              </Field>
              <Field label="Purchased renewable (kWh)" error={err('purchasedRenewableKwh')}
                     hint="Green tariff / RECs"
                     valid={!!editing && !errors.purchasedRenewableKwh && editing.purchasedRenewableKwh !== ''}
                     tooltip="Renewable electricity you buy — green tariffs or Renewable Energy Certificates. Counts as zero-emission.">
                <Input type="number" min={0} step="any"
                       value={editing.purchasedRenewableKwh}
                       invalid={!!err('purchasedRenewableKwh')}
                       valid={!!editing && !errors.purchasedRenewableKwh && editing.purchasedRenewableKwh !== ''}
                       onChange={e => set('purchasedRenewableKwh', e.target.value === '' ? '' : Number(e.target.value))}
                       onBlur={() => setTouched(t => ({ ...t, purchasedRenewableKwh: true }))} />
              </Field>
              <Field label="On-site renewable (kWh)" error={err('onsiteRenewableKwh')}
                     hint="Solar PV, wind, etc."
                     valid={!!editing && !errors.onsiteRenewableKwh && editing.onsiteRenewableKwh !== ''}
                     tooltip="Electricity you generate on-site from solar panels, wind, etc. Counts as zero-emission.">
                <Input type="number" min={0} step="any"
                       value={editing.onsiteRenewableKwh}
                       invalid={!!err('onsiteRenewableKwh')}
                       valid={!!editing && !errors.onsiteRenewableKwh && editing.onsiteRenewableKwh !== ''}
                       onChange={e => set('onsiteRenewableKwh', e.target.value === '' ? '' : Number(e.target.value))}
                       onBlur={() => setTouched(t => ({ ...t, onsiteRenewableKwh: true }))} />
              </Field>
            </div>

            <Field label="Note" hint="Optional — e.g. meter reference"
                   tooltip="Any supporting detail — meter numbers, billing period, or estimation basis for the reviewer.">
              <Textarea rows={2} value={editing.note ?? ''}
                        onChange={e => set('note', e.target.value)} />
            </Field>

            {/* Live preview */}
            <div className="rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Calculated Scope 2 emissions</span>
                <span className="font-semibold text-brand-700 tabular-nums">
                  {fmt(previewTons)} tCO₂e
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Renewable share of this entry</span>
                <span className="font-medium text-emerald-700 tabular-nums">{fmt(previewRenewPct, 1)}%</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {Number(editing.gridKwh || 0).toLocaleString()} kWh grid × {previewFactor.toFixed(3)} kgCO₂e/kWh ÷ 1000
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Toast show={!!toast}>{toast}</Toast>
    </div>
  )
}
