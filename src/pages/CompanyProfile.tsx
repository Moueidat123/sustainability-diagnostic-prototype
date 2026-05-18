import { useMemo, useState } from 'react'
import { Save, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Button, Card, Field, Input, Select, Textarea, Toast } from '../components/ui'
import { useLocalState } from '../lib/storage'
import { EMPTY_COMPANY, KEYS, companyCompletion, type Company } from '../lib/types'
import { COUNTRIES, SECTORS, REPORTING_YEARS } from '../lib/masterData'

type Errors = Partial<Record<keyof Company, string>>

function validate(c: Company): Errors {
  const e: Errors = {}
  if (!c.name.trim())          e.name = 'Company name is required'
  if (!c.legalEntity.trim())   e.legalEntity = 'Legal entity is required'
  if (!c.sector)               e.sector = 'Sector is required'
  if (!c.country)              e.country = 'Country is required'
  if (!c.reportingYear)        e.reportingYear = 'Reporting year is required'
  if (!c.contactName.trim())   e.contactName = 'Contact name is required'
  if (!c.contactEmail.trim())  e.contactEmail = 'Contact email is required'
  else if (!/^\S+@\S+\.\S+$/.test(c.contactEmail)) e.contactEmail = 'Invalid email format'
  return e
}

export default function CompanyProfile() {
  const [saved, setSaved] = useLocalState<Company>(KEYS.company, EMPTY_COMPANY)
  const [draft, setDraft] = useState<Company>(saved)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState(false)

  const errors = useMemo(() => validate(draft), [draft])
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const completion = companyCompletion(draft)

  const set = <K extends keyof Company>(k: K, v: Company[K]) =>
    setDraft(d => ({ ...d, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(Object.fromEntries(Object.keys(draft).map(k => [k, true])))
    if (Object.keys(errors).length > 0) return
    setSaved(draft)
    setToast(true)
    setTimeout(() => setToast(false), 2200)
  }

  const reset = () => {
    setDraft(saved)
    setTouched({})
  }

  const err = (k: keyof Company) => (touched[k] ? errors[k] : undefined)

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Company Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Basic company and legal entity information. Required for FR-003.
        </p>
      </header>

      {/* Completion bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span>Profile completion</span>
            <span className="font-semibold text-slate-800">{completion}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
        {completion === 100 && (
          <span className="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 px-2 py-1 rounded">
            <CheckCircle2 size={14} /> Complete
          </span>
        )}
      </div>

      <form onSubmit={submit} noValidate>
        <Card title="Company details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company name" required error={err('name')}>
              <Input value={draft.name} invalid={!!err('name')}
                     onChange={e => set('name', e.target.value)}
                     onBlur={() => setTouched(t => ({ ...t, name: true }))}
                     placeholder="e.g. Acme Industries Ltd." />
            </Field>

            <Field label="Legal entity" required error={err('legalEntity')}>
              <Input value={draft.legalEntity} invalid={!!err('legalEntity')}
                     onChange={e => set('legalEntity', e.target.value)}
                     onBlur={() => setTouched(t => ({ ...t, legalEntity: true }))}
                     placeholder="Registered legal name" />
            </Field>

            <Field label="Sector" required error={err('sector')}>
              <Select value={draft.sector} invalid={!!err('sector')}
                      onChange={e => set('sector', e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, sector: true }))}>
                <option value="">Select sector…</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>

            <Field label="Country" required error={err('country')}>
              <Select value={draft.country} invalid={!!err('country')}
                      onChange={e => set('country', e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, country: true }))}>
                <option value="">Select country…</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>

            <Field label="Reporting year" required error={err('reportingYear')}>
              <Select value={draft.reportingYear}
                      onChange={e => set('reportingYear', e.target.value)}>
                {REPORTING_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
            </Field>

            <div /> {/* spacer */}

            <Field label="Business description" hint="Short description used in the final report.">
              <Textarea value={draft.description}
                        onChange={e => set('description', e.target.value)}
                        placeholder="What the company does, main activities, markets…"
                        rows={3} />
            </Field>

            <div /> {/* spacer */}
          </div>
        </Card>

        <div className="h-4" />

        <Card title="Primary contact">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Contact name" required error={err('contactName')}>
              <Input value={draft.contactName} invalid={!!err('contactName')}
                     onChange={e => set('contactName', e.target.value)}
                     onBlur={() => setTouched(t => ({ ...t, contactName: true }))} />
            </Field>
            <Field label="Email" required error={err('contactEmail')}>
              <Input type="email" value={draft.contactEmail} invalid={!!err('contactEmail')}
                     onChange={e => set('contactEmail', e.target.value)}
                     onBlur={() => setTouched(t => ({ ...t, contactEmail: true }))}
                     placeholder="name@company.com" />
            </Field>
            <Field label="Phone">
              <Input value={draft.contactPhone}
                     onChange={e => set('contactPhone', e.target.value)}
                     placeholder="+966 …" />
            </Field>
          </div>
        </Card>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={reset} disabled={!dirty}>
            <RotateCcw size={16} /> Reset
          </Button>
          <Button type="submit" disabled={!dirty}>
            <Save size={16} /> Save profile
          </Button>
        </div>
      </form>

      <Toast show={toast}>Company profile saved.</Toast>
    </div>
  )
}
