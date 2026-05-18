import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Truck, MapPin, Info } from 'lucide-react'
import { Button, Card, Field, Input, Modal, Select, Textarea, Toast } from '../components/ui'
import { useLocalState, uid } from '../lib/storage'
import { KEYS, type FleetEntry, type Site } from '../lib/types'
import {
  VEHICLE_FUELS, VEHICLE_TYPES, FUEL_FACTOR_VERSION,
  findFuel, fleetEmissionsTons, fleetConsumedQuantity,
} from '../lib/emissionFactors'

const EMPTY: FleetEntry = {
  id: '', siteId: '', vehicleType: '', fuelId: '',
  vehicleCount: '', mode: 'fuel',
  quantity: '', kmDriven: '', consumptionPer100km: '',
  note: '',
}

type Errors = Partial<Record<keyof FleetEntry, string>>

function validate(e: FleetEntry, sitesExist: boolean): Errors {
  const errs: Errors = {}
  if (!sitesExist)        errs.siteId      = 'Add at least one site first'
  else if (!e.siteId)     errs.siteId      = 'Required'
  if (!e.vehicleType)     errs.vehicleType = 'Required'
  if (!e.fuelId)          errs.fuelId      = 'Required'
  if (e.vehicleCount !== '' && (isNaN(Number(e.vehicleCount)) || Number(e.vehicleCount) < 1))
    errs.vehicleCount = 'Must be ≥ 1'

  if (e.mode === 'fuel') {
    if (e.quantity === '' || Number(e.quantity) <= 0) errs.quantity = 'Required (> 0)'
  } else {
    if (e.kmDriven === '' || Number(e.kmDriven) <= 0)
      errs.kmDriven = 'Required (> 0)'
    if (e.consumptionPer100km === '' || Number(e.consumptionPer100km) <= 0)
      errs.consumptionPer100km = 'Required (> 0)'
  }
  return errs
}

function fmt(n: number, digits = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export default function Scope1Fleet() {
  const [sites] = useLocalState<Site[]>(KEYS.sites, [])
  const [entries, setEntries] = useLocalState<FleetEntry[]>(KEYS.fleet, [])
  const [editing, setEditing] = useState<FleetEntry | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  const errors = useMemo(
    () => editing ? validate(editing, sites.length > 0) : {},
    [editing, sites.length]
  )

  const totalTons = useMemo(
    () => entries.reduce((s, e) => s + fleetEmissionsTons(
      e.fuelId, e.mode, Number(e.quantity || 0),
      Number(e.kmDriven || 0), Number(e.consumptionPer100km || 0),
    ), 0),
    [entries]
  )

  const perSiteTotals = useMemo(() => {
    const m = new Map<string, number>()
    entries.forEach(e => {
      const t = fleetEmissionsTons(
        e.fuelId, e.mode, Number(e.quantity || 0),
        Number(e.kmDriven || 0), Number(e.consumptionPer100km || 0),
      )
      m.set(e.siteId, (m.get(e.siteId) ?? 0) + t)
    })
    return m
  }, [entries])

  const openAdd  = () => { setTouched({}); setEditing({ ...EMPTY, id: uid(), siteId: sites[0]?.id ?? '' }) }
  const openEdit = (e: FleetEntry) => { setTouched({}); setEditing({ ...e }) }
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
    setToast('Fleet entry saved.')
    setTimeout(() => setToast(null), 2000)
    close()
  }

  const remove = (id: string) => {
    if (!confirm('Delete this fleet entry?')) return
    setEntries(list => list.filter(e => e.id !== id))
    setToast('Entry deleted.')
    setTimeout(() => setToast(null), 2000)
  }

  const err = (k: keyof FleetEntry) => (touched[k] ? errors[k] : undefined)
  const set = <K extends keyof FleetEntry>(k: K, v: FleetEntry[K]) =>
    setEditing(s => s ? { ...s, [k]: v } : s)

  // Live preview
  const previewFactor = editing ? findFuel(editing.fuelId) : undefined
  const previewConsumed = editing ? fleetConsumedQuantity({
    mode: editing.mode,
    quantity: Number(editing.quantity || 0),
    kmDriven: Number(editing.kmDriven || 0),
    consumptionPer100km: Number(editing.consumptionPer100km || 0),
  }) : 0
  const previewTons = editing ? fleetEmissionsTons(
    editing.fuelId, editing.mode,
    Number(editing.quantity || 0),
    Number(editing.kmDriven || 0),
    Number(editing.consumptionPer100km || 0),
  ) : 0

  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Scope 1 – Fleet</h1>
          <p className="mt-1 text-sm text-slate-600">
            Company-owned or leased vehicle emissions (FR-006). Enter fuel directly, or by distance &amp; consumption rate (FR-011).
          </p>
        </div>
        <Button onClick={openAdd} disabled={sites.length === 0}>
          <Plus size={16} /> Add fleet entry
        </Button>
      </header>

      {/* No sites */}
      {sites.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mb-3">
              <MapPin size={20} />
            </div>
            <p className="text-sm text-slate-700 font-medium">You need at least one site before adding fleet data.</p>
            <p className="text-xs text-slate-500 mt-1">Vehicles are recorded against a site so emissions can be summarised per location.</p>
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
            <div className="text-xs text-slate-500">Total Scope 1 – Fleet</div>
            <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {fmt(totalTons)} <span className="text-sm font-normal text-slate-500">tCO₂e</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{entries.length} entries across {perSiteTotals.size} site(s)</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 md:col-span-2">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Info size={12} /> Calculation method</div>
            <div className="text-sm text-slate-800 mt-1">{FUEL_FACTOR_VERSION}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
              fuel mode: <em>quantity × factor ÷ 1000</em>
              {' · '}distance mode: <em>(km × L/100km ÷ 100) × factor ÷ 1000</em>
            </div>
          </div>
        </div>
      )}

      {/* Entries table */}
      {sites.length > 0 && (
        <Card title={`Fleet entries (${entries.length})`}>
          {entries.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 mb-3">
                <Truck size={20} />
              </div>
              <p className="text-sm text-slate-600">No fleet entries yet.</p>
              <p className="text-xs text-slate-400 mt-1">Click <strong>Add fleet entry</strong> to record vehicles.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="text-left  font-medium px-5 py-2">Site</th>
                    <th className="text-left  font-medium px-3 py-2">Vehicle type</th>
                    <th className="text-left  font-medium px-3 py-2">Fuel</th>
                    <th className="text-right font-medium px-3 py-2">Vehicles</th>
                    <th className="text-left  font-medium px-3 py-2">Mode</th>
                    <th className="text-right font-medium px-3 py-2">Consumed</th>
                    <th className="text-right font-medium px-3 py-2">tCO₂e</th>
                    <th className="w-20 px-5 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => {
                    const site = sites.find(s => s.id === e.siteId)
                    const f = findFuel(e.fuelId)
                    const consumed = fleetConsumedQuantity({
                      mode: e.mode,
                      quantity: Number(e.quantity || 0),
                      kmDriven: Number(e.kmDriven || 0),
                      consumptionPer100km: Number(e.consumptionPer100km || 0),
                    })
                    const tons = fleetEmissionsTons(
                      e.fuelId, e.mode, Number(e.quantity || 0),
                      Number(e.kmDriven || 0), Number(e.consumptionPer100km || 0),
                    )
                    return (
                      <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {site?.name ?? <span className="text-red-600 text-xs">Site missing</span>}
                        </td>
                        <td className="px-3 py-3 text-slate-700">{e.vehicleType}</td>
                        <td className="px-3 py-3 text-slate-700">{f?.label ?? '—'}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                          {e.vehicleCount === '' ? '—' : Number(e.vehicleCount).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <span className="inline-block bg-slate-100 text-slate-700 rounded px-2 py-0.5">
                            {e.mode === 'fuel' ? 'Fuel' : 'Distance'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                          {consumed > 0 ? `${fmt(consumed)} ${f?.unit ?? ''}` : '—'}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums font-semibold text-brand-700">
                          {fmt(tons)}
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
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-brand-700">{fmt(totalTons)}</td>
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
        <Card title="Per-site fleet totals">
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
        title={editing && entries.some(e => e.id === editing.id) ? 'Edit fleet entry' : 'Add fleet entry'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={close}>Cancel</Button>
            <Button type="submit" form="fleet-form">Save entry</Button>
          </>
        }
      >
        {editing && (
          <form id="fleet-form" onSubmit={save} noValidate className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Site" required error={err('siteId')}>
                <Select value={editing.siteId} invalid={!!err('siteId')}
                        onChange={e => set('siteId', e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, siteId: true }))}>
                  <option value="">Select site…</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
                </Select>
              </Field>

              <Field label="Vehicle type" required error={err('vehicleType')}>
                <Select value={editing.vehicleType} invalid={!!err('vehicleType')}
                        onChange={e => set('vehicleType', e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, vehicleType: true }))}>
                  <option value="">Select…</option>
                  {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </Select>
              </Field>

              <Field label="Fuel" required error={err('fuelId')}>
                <Select value={editing.fuelId} invalid={!!err('fuelId')}
                        onChange={e => set('fuelId', e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, fuelId: true }))}>
                  <option value="">Select fuel…</option>
                  {VEHICLE_FUELS.map(f => (
                    <option key={f.id} value={f.id}>{f.label} ({f.unit})</option>
                  ))}
                </Select>
              </Field>

              <Field label="Number of vehicles" error={err('vehicleCount')} hint="Optional — for reference only">
                <Input type="number" min={1} value={editing.vehicleCount}
                       invalid={!!err('vehicleCount')}
                       onChange={e => set('vehicleCount', e.target.value === '' ? '' : Number(e.target.value))}
                       onBlur={() => setTouched(t => ({ ...t, vehicleCount: true }))} />
              </Field>
            </div>

            {/* Mode switch */}
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1.5">Entry method</div>
              <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-sm">
                <button type="button"
                  onClick={() => set('mode', 'fuel')}
                  className={`px-3 py-1.5 rounded ${editing.mode === 'fuel' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                  Fuel quantity
                </button>
                <button type="button"
                  onClick={() => set('mode', 'distance')}
                  className={`px-3 py-1.5 rounded ${editing.mode === 'distance' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                  Distance &amp; consumption
                </button>
              </div>
            </div>

            {/* Mode-specific inputs */}
            {editing.mode === 'fuel' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Fuel consumed" required error={err('quantity')}
                       hint={previewFactor ? `Unit: ${previewFactor.unit}` : 'Pick a fuel to see the unit'}>
                  <Input type="number" min={0} step="any"
                         value={editing.quantity} invalid={!!err('quantity')}
                         onChange={e => set('quantity', e.target.value === '' ? '' : Number(e.target.value))}
                         onBlur={() => setTouched(t => ({ ...t, quantity: true }))} />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Total km driven" required error={err('kmDriven')}>
                  <Input type="number" min={0} step="any"
                         value={editing.kmDriven} invalid={!!err('kmDriven')}
                         onChange={e => set('kmDriven', e.target.value === '' ? '' : Number(e.target.value))}
                         onBlur={() => setTouched(t => ({ ...t, kmDriven: true }))} />
                </Field>
                <Field label={`Consumption per 100 km (${previewFactor?.unit ?? 'unit'}/100km)`}
                       required error={err('consumptionPer100km')}
                       hint="Typical: petrol cars ~8, vans ~10, trucks ~30">
                  <Input type="number" min={0} step="any"
                         value={editing.consumptionPer100km} invalid={!!err('consumptionPer100km')}
                         onChange={e => set('consumptionPer100km', e.target.value === '' ? '' : Number(e.target.value))}
                         onBlur={() => setTouched(t => ({ ...t, consumptionPer100km: true }))} />
                </Field>
              </div>
            )}

            <Field label="Note" hint="Optional">
              <Textarea rows={2} value={editing.note ?? ''}
                        onChange={e => set('note', e.target.value)} />
            </Field>

            {/* Live preview */}
            <div className="rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Calculated emissions</span>
                <span className="font-semibold text-brand-700 tabular-nums">
                  {fmt(previewTons)} tCO₂e
                </span>
              </div>
              {previewFactor && (
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  {editing.mode === 'fuel'
                    ? `${fmt(Number(editing.quantity || 0))} ${previewFactor.unit} × ${previewFactor.kgCO2ePerUnit} kgCO₂e/${previewFactor.unit} ÷ 1000`
                    : `${fmt(previewConsumed)} ${previewFactor.unit} consumed × ${previewFactor.kgCO2ePerUnit} kgCO₂e/${previewFactor.unit} ÷ 1000`}
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
