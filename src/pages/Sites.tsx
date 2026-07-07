import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import { Button, Card, Field, Input, Modal, Select, Toast } from '../components/ui'
import { useLocalState, uid } from '../lib/storage'
import { KEYS, type Site } from '../lib/types'
import { COUNTRIES, OWNERSHIP_TYPES } from '../lib/masterData'

const EMPTY_SITE: Site = { id: '', name: '', city: '', country: '', ownership: '', floorArea: '' }

type Errors = Partial<Record<keyof Site, string>>

function validate(s: Site): Errors {
  const e: Errors = {}
  if (!s.name.trim())  e.name = 'Required'
  if (!s.city.trim())  e.city = 'Required'
  if (!s.country)      e.country = 'Required'
  if (!s.ownership)    e.ownership = 'Required'
  if (s.floorArea !== '' && (isNaN(Number(s.floorArea)) || Number(s.floorArea) < 0))
    e.floorArea = 'Must be a positive number'
  return e
}

export default function Sites() {
  const [sites, setSites] = useLocalState<Site[]>(KEYS.sites, [])
  const [editing, setEditing] = useState<Site | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  const errors = useMemo(() => editing ? validate(editing) : {}, [editing])

  const openAdd  = () => { setTouched({}); setEditing({ ...EMPTY_SITE, id: uid() }) }
  const openEdit = (s: Site) => { setTouched({}); setEditing({ ...s }) }
  const close    = () => setEditing(null)

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setTouched(Object.fromEntries(Object.keys(editing).map(k => [k, true])))
    if (Object.keys(errors).length > 0) return
    setSites(list => {
      const exists = list.some(s => s.id === editing.id)
      return exists ? list.map(s => s.id === editing.id ? editing : s) : [...list, editing]
    })
    setToast('Site saved.')
    setTimeout(() => setToast(null), 2000)
    close()
  }

  const remove = (id: string) => {
    if (!confirm('Delete this site? All associated fuel, fleet and electricity data will lose its link.')) return
    setSites(list => list.filter(s => s.id !== id))
    setToast('Site deleted.')
    setTimeout(() => setToast(null), 2000)
  }

  const err = (k: keyof Site) => (touched[k] ? errors[k] : undefined)
  const ok  = (k: keyof Site) => !!editing && !errors[k] && String(editing[k] ?? '').trim() !== ''
  const set = <K extends keyof Site>(k: K, v: Site[K]) =>
    setEditing(s => s ? { ...s, [k]: v } : s)

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sites</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add one or more sites. Emissions are summarised per site (FR-004, FR-012).
          </p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Add site</Button>
      </header>

      <Card title={`${sites.length} site${sites.length === 1 ? '' : 's'}`}>
        {sites.length === 0 ? (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 mb-3">
              <MapPin size={20} />
            </div>
            <p className="text-sm text-slate-600">No sites added yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click <strong>Add site</strong> to create the first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="text-left font-medium px-5 py-2">Site name</th>
                  <th className="text-left font-medium px-3 py-2">City</th>
                  <th className="text-left font-medium px-3 py-2">Country</th>
                  <th className="text-left font-medium px-3 py-2">Ownership</th>
                  <th className="text-right font-medium px-3 py-2">Floor area (m²)</th>
                  <th className="w-20 px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sites.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-3 py-3 text-slate-700">{s.city}</td>
                    <td className="px-3 py-3 text-slate-700">{s.country}</td>
                    <td className="px-3 py-3">
                      <span className="inline-block text-xs bg-slate-100 text-slate-700 rounded px-2 py-0.5">
                        {s.ownership}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700 tabular-nums">
                      {s.floorArea === '' ? '—' : Number(s.floorArea).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => openEdit(s)} className="text-slate-500 hover:text-brand-700 p-1" title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(s.id)} className="text-slate-500 hover:text-red-600 p-1 ml-1" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!editing}
        onClose={close}
        title={editing && sites.some(s => s.id === editing.id) ? 'Edit site' : 'Add site'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={close}>Cancel</Button>
            <Button type="submit" form="site-form">Save site</Button>
          </>
        }
      >
        {editing && (
          <form id="site-form" onSubmit={save} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Site name" required error={err('name')} valid={ok('name')}
                   tooltip="A recognisable name for this location — used across all emissions tables and charts.">
              <Input value={editing.name} invalid={!!err('name')} valid={ok('name')}
                     onChange={e => set('name', e.target.value)}
                     onBlur={() => setTouched(t => ({ ...t, name: true }))}
                     placeholder="e.g. Riyadh Head Office" />
            </Field>
            <Field label="City" required error={err('city')} valid={ok('city')}
                   tooltip="The city where this site is located.">
              <Input value={editing.city} invalid={!!err('city')} valid={ok('city')}
                     onChange={e => set('city', e.target.value)}
                     onBlur={() => setTouched(t => ({ ...t, city: true }))} />
            </Field>
            <Field label="Country" required error={err('country')} valid={ok('country')}
                   tooltip="Country of this site. Sets the default electricity grid factor for its Scope 2 entries.">
              <Select value={editing.country} invalid={!!err('country')} valid={ok('country')}
                      onChange={e => set('country', e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, country: true }))}>
                <option value="">Select country…</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Ownership" required error={err('ownership')} valid={ok('ownership')}
                   tooltip="Whether the site is owned, leased or co-located. Affects operational vs financial control boundaries.">
              <Select value={editing.ownership} invalid={!!err('ownership')} valid={ok('ownership')}
                      onChange={e => set('ownership', e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, ownership: true }))}>
                <option value="">Select…</option>
                {OWNERSHIP_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="Floor area (m²)" error={err('floorArea')} hint="Optional"
                   valid={!!editing && !errors.floorArea && editing.floorArea !== '' }
                   tooltip="Optional gross internal floor area in square metres. Enables emissions-intensity metrics later.">
              <Input type="number" min={0} value={editing.floorArea}
                     invalid={!!err('floorArea')}
                     valid={!!editing && !errors.floorArea && editing.floorArea !== ''}
                     onChange={e => set('floorArea', e.target.value === '' ? '' : Number(e.target.value))}
                     onBlur={() => setTouched(t => ({ ...t, floorArea: true }))} />
            </Field>
          </form>
        )}
      </Modal>

      <Toast show={!!toast}>{toast}</Toast>
    </div>
  )
}
