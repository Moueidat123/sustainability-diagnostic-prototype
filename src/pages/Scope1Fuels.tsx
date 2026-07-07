import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Flame, MapPin, Info } from 'lucide-react'
import { Button, Card, Field, Input, Modal, Select, Textarea, Toast } from '../components/ui'
import { useLocalState, uid } from '../lib/storage'
import { KEYS, type FuelEntry, type Site } from '../lib/types'
import { FUEL_FACTORS, FUEL_FACTOR_VERSION, findFuel, fuelEmissionsTons } from '../lib/emissionFactors'

const EMPTY: FuelEntry = { id: '', siteId: '', fuelId: '', quantity: '', note: '' }

type Errors = Partial<Record<keyof FuelEntry, string>>

function validate(e: FuelEntry, sitesExist: boolean): Errors {
  const errs: Errors = {}
  if (!sitesExist)                         errs.siteId = 'Add at least one site first'
  else if (!e.siteId)                      errs.siteId = 'Required'
  if (!e.fuelId)                           errs.fuelId = 'Required'
  if (e.quantity === '' || e.quantity === undefined) errs.quantity = 'Required'
  else if (isNaN(Number(e.quantity)) || Number(e.quantity) <= 0)
    errs.quantity = 'Must be a positive number'
  return errs
}

function fmtNum(n: number, digits = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export default function Scope1Fuels() {
  const [sites] = useLocalState<Site[]>(KEYS.sites, [])
  const [entries, setEntries] = useLocalState<FuelEntry[]>(KEYS.fuels, [])
  const [editing, setEditing] = useState<FuelEntry | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  const errors = useMemo(
    () => editing ? validate(editing, sites.length > 0) : {},
    [editing, sites.length]
  )

  const totalTons = useMemo(
    () => entries.reduce((sum, e) => sum + fuelEmissionsTons(e.fuelId, Number(e.quantity || 0)), 0),
    [entries]
  )

  const perSiteTotals = useMemo(() => {
    const map = new Map<string, number>()
    entries.forEach(e => {
      const t = fuelEmissionsTons(e.fuelId, Number(e.quantity || 0))
      map.set(e.siteId, (map.get(e.siteId) ?? 0) + t)
    })
    return map
  }, [entries])

  const openAdd  = () => { setTouched({}); setEditing({ ...EMPTY, id: uid(), siteId: sites[0]?.id ?? '' }) }
  const openEdit = (e: FuelEntry) => { setTouched({}); setEditing({ ...e }) }
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
    setToast('Fuel entry saved.')
    setTimeout(() => setToast(null), 2000)
    close()
  }

  const remove = (id: string) => {
    if (!confirm('Delete this fuel entry?')) return
    setEntries(list => list.filter(e => e.id !== id))
    setToast('Entry deleted.')
    setTimeout(() => setToast(null), 2000)
  }

  const err = (k: keyof FuelEntry) => (touched[k] ? errors[k] : undefined)
  const ok  = (k: keyof FuelEntry) => !!editing && !errors[k] && String(editing[k] ?? '').trim() !== ''
  const set = <K extends keyof FuelEntry>(k: K, v: FuelEntry[K]) =>
    setEditing(s => s ? { ...s, [k]: v } : s)

  // Live preview inside modal
  const previewTons = editing
    ? fuelEmissionsTons(editing.fuelId, Number(editing.quantity || 0))
    : 0
  const previewFactor = editing ? findFuel(editing.fuelId) : undefined

  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Scope 1 – Fuels</h1>
          <p className="mt-1 text-sm text-slate-600">
            Stationary fuel consumption per site (FR-005). Emissions are auto-calculated using controlled emission factors (FR-010, FR-011).
          </p>
        </div>
        <Button onClick={openAdd} disabled={sites.length === 0}>
          <Plus size={16} /> Add fuel entry
        </Button>
      </header>

      {/* Empty state when no sites */}
      {sites.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mb-3">
              <MapPin size={20} />
            </div>
            <p className="text-sm text-slate-700 font-medium">You need at least one site before adding fuel data.</p>
            <p className="text-xs text-slate-500 mt-1">Fuel consumption is recorded <em>per site</em> so emissions can be summarised by location.</p>
            <Link to="/sites" className="inline-block mt-4">
              <Button variant="primary"><MapPin size={16} /> Go to Sites</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* KPI strip */}
      {sites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500">Total Scope 1 – Fuels</div>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {fmtNum(totalTons)} <span className="text-sm font-normal text-slate-500">tCO₂e</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{entries.length} entries across {perSiteTotals.size} site(s)</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 md:col-span-2">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Info size={12} /> Emission factor set
            </div>
            <div className="text-sm font-medium text-slate-800 mt-1">{FUEL_FACTOR_VERSION}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Managed in the Admin module. Calculation: <span className="font-mono">quantity × factor ÷ 1000</span> = tCO₂e.
            </div>
          </div>
        </div>
      )}

      {/* Entries table */}
      {sites.length > 0 && (
        <Card title={`Fuel entries (${entries.length})`}>
          {entries.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 mb-3">
                <Flame size={20} />
              </div>
              <p className="text-sm text-slate-600">No fuel entries yet.</p>
              <p className="text-xs text-slate-400 mt-1">Click <strong>Add fuel entry</strong> to record consumption.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="text-left  font-medium px-5 py-2">Site</th>
                    <th className="text-left  font-medium px-3 py-2">Fuel type</th>
                    <th className="text-right font-medium px-3 py-2">Quantity</th>
                    <th className="text-left  font-medium px-3 py-2">Unit</th>
                    <th className="text-right font-medium px-3 py-2">Factor (kgCO₂e/unit)</th>
                    <th className="text-right font-medium px-3 py-2">tCO₂e</th>
                    <th className="w-20 px-5 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => {
                    const site = sites.find(s => s.id === e.siteId)
                    const f = findFuel(e.fuelId)
                    const tons = fuelEmissionsTons(e.fuelId, Number(e.quantity || 0))
                    return (
                      <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {site?.name ?? <span className="text-red-600 text-xs">Site missing</span>}
                        </td>
                        <td className="px-3 py-3 text-slate-700">{f?.label ?? '—'}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                          {e.quantity === '' ? '—' : Number(e.quantity).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-slate-600 text-xs">{f?.unit ?? '—'}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-600 text-xs">{f ? f.kgCO2ePerUnit : '—'}</td>
                        <td className="px-3 py-3 text-right tabular-nums font-semibold text-brand-700">
                          {fmtNum(tons)}
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
                    <td colSpan={5} className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-brand-700">{fmtNum(totalTons)}</td>
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
        <Card title="Per-site totals" subtitle="Scope 1 — fuels only (Scope 1 fleet and Scope 2 added in next steps).">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sites.map(s => {
              const t = perSiteTotals.get(s.id) ?? 0
              const pct = totalTons > 0 ? (t / totalTons) * 100 : 0
              return (
                <div key={s.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-900 truncate">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.city}</div>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-900 tabular-nums">
                    {fmtNum(t)} <span className="text-xs font-normal text-slate-500">tCO₂e</span>
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
        title={editing && entries.some(e => e.id === editing.id) ? 'Edit fuel entry' : 'Add fuel entry'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={close}>Cancel</Button>
            <Button type="submit" form="fuel-form">Save entry</Button>
          </>
        }
      >
        {editing && (
          <form id="fuel-form" onSubmit={save} noValidate className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Site" required error={err('siteId')} valid={ok('siteId')}
                     tooltip="Which location this fuel was burned at. Emissions are grouped per site.">
                <Select value={editing.siteId} invalid={!!err('siteId')} valid={ok('siteId')}
                        onChange={e => set('siteId', e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, siteId: true }))}>
                  <option value="">Select site…</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
                </Select>
              </Field>
              <Field label="Fuel type" required error={err('fuelId')} valid={ok('fuelId')}
                     tooltip="Stationary combustion fuel — e.g. natural gas for heating, diesel for generators. The unit updates to match.">
                <Select value={editing.fuelId} invalid={!!err('fuelId')} valid={ok('fuelId')}
                        onChange={e => set('fuelId', e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, fuelId: true }))}>
                  <option value="">Select fuel…</option>
                  {FUEL_FACTORS.map(f => (
                    <option key={f.id} value={f.id}>{f.label} ({f.unit})</option>
                  ))}
                </Select>
              </Field>
              <Field label="Quantity" required error={err('quantity')} valid={ok('quantity')}
                     hint={previewFactor ? `Unit: ${previewFactor.unit}` : 'Pick a fuel to see the unit'}
                     tooltip="Total amount consumed during the reporting year, in the unit shown for the chosen fuel.">
                <Input type="number" min={0} step="any"
                       value={editing.quantity}
                       invalid={!!err('quantity')} valid={ok('quantity')}
                       onChange={e => set('quantity', e.target.value === '' ? '' : Number(e.target.value))}
                       onBlur={() => setTouched(t => ({ ...t, quantity: true }))} />
              </Field>
              <Field label="Note" hint="Optional — e.g. meter reading reference"
                     tooltip="Any supporting detail a reviewer might need — meter IDs, estimation basis, invoice references.">
                <Textarea rows={2} value={editing.note ?? ''}
                          onChange={e => set('note', e.target.value)} />
              </Field>
            </div>

            {/* Live preview */}
            <div className="rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Calculated emissions</span>
                <span className="font-semibold text-brand-700 tabular-nums">
                  {fmtNum(previewTons)} tCO₂e
                </span>
              </div>
              {previewFactor && (
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  {Number(editing.quantity || 0).toLocaleString()} {previewFactor.unit} × {previewFactor.kgCO2ePerUnit} kgCO₂e/{previewFactor.unit} ÷ 1000
                </div>
              )}
            </div>
          </form>
        )}
      </Modal>

      <Toast show={!!toast}>{toast}</Toast>
    </div>
  )
}
