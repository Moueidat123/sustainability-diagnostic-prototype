import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award, ShieldCheck, CheckCircle2, Circle, AlertCircle,
  Sparkles, Building2, MapPin, ClipboardCheck, BadgeCheck, Globe,
  Info, RotateCcw,
} from 'lucide-react'
import { useLocalState } from '../lib/storage'
import {
  EMPTY_COMPANY, EMPTY_WORKFLOW, KEYS, companyCompletion,
  type Company, type Site, type FuelEntry, type FleetEntry, type ElectricityEntry,
  type Workflow,
} from '../lib/types'
import {
  CATEGORIES, TIER_THRESHOLDS, TIER_LABEL, TIER_COLOR, STAGES,
  EMPTY_ACCREDITATION, scoreFor, suggestedTier,
  type AccreditationState, type Tier, type StageId,
} from '../lib/accreditation'
import { electricityEmissionsTons } from '../lib/emissionFactors'
import { ROLES } from '../lib/roles'
import { useRole } from '../lib/useRole'
import { Button, Textarea } from '../components/ui'

function fmtDate(ts?: number) {
  if (!ts) return ''
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function TierBadge({ tier, size = 'md' }: { tier: Tier; size?: 'sm' | 'md' | 'lg' }) {
  const c = TIER_COLOR[tier]
  const sz = size === 'lg' ? 'text-base px-4 py-1.5' : size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-3 py-1'
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ring-1 ${c.bg} ${c.text} ${c.ring} ${sz}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {TIER_LABEL[tier]}
    </span>
  )
}

export default function Accreditation() {
  const { role } = useRole()
  const roleLabel = ROLES.find(r => r.id === role)?.label ?? role

  const [company]     = useLocalState<Company>(KEYS.company, EMPTY_COMPANY)
  const [sites]       = useLocalState<Site[]>(KEYS.sites, [])
  const [fuels]       = useLocalState<FuelEntry[]>(KEYS.fuels, [])
  const [fleet]       = useLocalState<FleetEntry[]>(KEYS.fleet, [])
  const [electricity] = useLocalState<ElectricityEntry[]>(KEYS.electricity, [])
  const [wf]          = useLocalState<Workflow>(KEYS.workflow, EMPTY_WORKFLOW)

  const [state, setState] = useLocalState<AccreditationState>(KEYS.accreditation, EMPTY_ACCREDITATION)
  const [pmDraftNote, setPmDraftNote] = useState('')

  // Pre-tick criteria covered by data already entered (best-effort hints)
  const renewablePct = useMemo(() => {
    let g = 0, p = 0, o = 0
    electricity.forEach(e => {
      g += Number(e.gridKwh || 0)
      p += Number(e.purchasedRenewableKwh || 0)
      o += Number(e.onsiteRenewableKwh || 0)
    })
    const tot = g + p + o
    return tot > 0 ? ((p + o) / tot) * 100 : 0
  }, [electricity])

  // Auto-derived "evidence" hints — these are read-only suggestions, not auto-checks
  const evidence: Record<string, string | undefined> = {
    'carbon.scope12': (fuels.length || fleet.length || electricity.length)
      ? 'Detected: emissions data has been entered in the diagnostic.' : undefined,
    'energy.renew10': renewablePct >= 10 ? `Detected: ${renewablePct.toFixed(0)}% renewable electricity.` : undefined,
    'energy.renew50': renewablePct >= 50 ? `Detected: ${renewablePct.toFixed(0)}% renewable electricity.` : undefined,
  }

  const { earned, possible, pct, perCategory } = scoreFor(state.answers)
  const proposedTier = suggestedTier(pct)

  // Launch stages: derived
  const eligibilityOk = companyCompletion(company) === 100 && sites.length > 0
  const diagnosticOk  = wf.status === 'submitted' || wf.status === 'changes_requested' || wf.status === 'approved'
  const reviewedOk    = wf.status === 'approved'
  const accreditedOk  = state.assignedTier !== 'none'
  const publishedOk   = state.published

  const stageState: Record<StageId, 'done' | 'current' | 'todo'> = (() => {
    const flags: [StageId, boolean][] = [
      ['eligibility', eligibilityOk],
      ['diagnostic',  diagnosticOk],
      ['review',      reviewedOk],
      ['accredited',  accreditedOk],
      ['published',   publishedOk],
    ]
    const out: Record<StageId, 'done' | 'current' | 'todo'> = {
      eligibility: 'todo', diagnostic: 'todo', review: 'todo', accredited: 'todo', published: 'todo',
    }
    let foundCurrent = false
    flags.forEach(([id, ok]) => {
      if (ok) out[id] = 'done'
      else if (!foundCurrent) { out[id] = 'current'; foundCurrent = true }
    })
    return out
  })()

  // ----- mutations -----
  function toggleCriterion(id: string) {
    if (!(role === 'partner' || role === 'program_manager')) return
    setState(prev => ({ ...prev, answers: { ...prev.answers, [id]: !prev.answers[id] } }))
  }

  function assignTier(t: Tier) {
    setState(prev => ({
      ...prev,
      assignedTier: t,
      assignedAt: Date.now(),
      assignedBy: roleLabel,
      pmNote: pmDraftNote || prev.pmNote,
    }))
    setPmDraftNote('')
  }

  function publish() {
    setState(prev => ({ ...prev, published: true, publishedAt: Date.now() }))
  }

  function unpublish() {
    setState(prev => ({ ...prev, published: false, publishedAt: undefined }))
  }

  function resetAccreditation() {
    if (!confirm('Reset tier assignment and publication? Checklist answers are kept.')) return
    setState(prev => ({
      ...prev,
      assignedTier: 'none',
      assignedAt: undefined,
      assignedBy: undefined,
      published: false,
      publishedAt: undefined,
    }))
  }

  // ----- role gates -----
  const canEditChecklist = role === 'partner' || role === 'program_manager'
  const canAssignTier    = role === 'program_manager' && reviewedOk
  const canPublish       = role === 'program_manager' && accreditedOk
  const canReset         = role === 'program_manager' || role === 'admin'

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
            <Award size={14} /> Accreditation
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">
            {company.name ? `${company.name} accreditation` : 'Partner accreditation'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Earn Essential, Advanced or Elite tier by completing the diagnostic and meeting category criteria.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state.published && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
              <Globe size={12} /> Published
            </span>
          )}
          <TierBadge tier={state.assignedTier} size="lg" />
        </div>
      </div>

      {/* Launch stages stepper */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Launch stages</h2>
        <ol className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {STAGES.map((stg, i) => {
            const st = stageState[stg.id]
            const icon = st === 'done'
              ? <CheckCircle2 size={16} className="text-emerald-600" />
              : st === 'current'
              ? <AlertCircle size={16} className="text-amber-500" />
              : <Circle size={16} className="text-slate-300" />
            const ring = st === 'done'
              ? 'border-emerald-200 bg-emerald-50/40'
              : st === 'current'
              ? 'border-amber-200 bg-amber-50/40'
              : 'border-slate-200'
            return (
              <li key={stg.id} className={`relative rounded-lg border p-3 ${ring}`}>
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="text-[11px] uppercase tracking-wider text-slate-500">Step {i + 1}</span>
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900">{stg.label}</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug">{stg.description}</div>
              </li>
            )
          })}
        </ol>

        {/* Quick-fix shortcuts when blocked */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {!eligibilityOk && (
            <>
              {companyCompletion(company) < 100 && (
                <Link to="/company" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                  <Building2 size={12} /> Complete company profile
                </Link>
              )}
              {sites.length === 0 && (
                <Link to="/sites" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                  <MapPin size={12} /> Add a site
                </Link>
              )}
            </>
          )}
          {eligibilityOk && !reviewedOk && (
            <Link to="/review" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
              <ClipboardCheck size={12} /> Open Review & Workflow
            </Link>
          )}
        </div>
      </section>

      {/* Score panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">Checklist score</h2>
            <span className="text-xs text-slate-500 tabular-nums">{earned} / {possible} pts</span>
          </div>
          <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 via-indigo-400 to-amber-400 transition-all"
                 style={{ width: `${pct}%` }} />
            {/* Tier markers */}
            {TIER_THRESHOLDS.map(t => (
              <div key={t.tier}
                   className="absolute top-0 bottom-0 border-l border-white/70"
                   style={{ left: `${t.min}%` }}
                   title={`${TIER_LABEL[t.tier]} threshold (${t.min}%)`} />
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
            <span>0%</span>
            {TIER_THRESHOLDS.map(t => (
              <span key={t.tier} style={{ marginLeft: 'auto' }}>
                {TIER_LABEL[t.tier]} ≥ {t.min}%
              </span>
            ))}
            <span className="ml-2">100%</span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-2">
            {CATEGORIES.map(cat => {
              const c = perCategory[cat.id]
              const p = c.possible ? Math.round((c.earned / c.possible) * 100) : 0
              return (
                <div key={cat.id} className="rounded-md border border-slate-200 p-2">
                  <div className="text-[11px] text-slate-500 truncate">{cat.label}</div>
                  <div className="text-sm font-semibold text-slate-800 tabular-nums">{p}%</div>
                  <div className="h-1 bg-slate-100 rounded mt-1 overflow-hidden">
                    <div className="h-full bg-brand-600" style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-900">Proposed tier</h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Based on {pct.toFixed(0)}% of total checklist points.
          </p>
          <div className="flex items-center justify-center py-3">
            <TierBadge tier={proposedTier} size="lg" />
          </div>
          <div className="text-[11px] text-slate-500 text-center">
            {proposedTier === 'none'
              ? `Reach ${TIER_THRESHOLDS[0].min}% to qualify for Essential.`
              : proposedTier === 'elite'
              ? 'Highest tier — Elite.'
              : `Next: ${TIER_LABEL[
                  TIER_THRESHOLDS[TIER_THRESHOLDS.findIndex(t => t.tier === proposedTier) + 1].tier
                ]} at ${
                  TIER_THRESHOLDS[TIER_THRESHOLDS.findIndex(t => t.tier === proposedTier) + 1].min
                }%`}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Assigned tier</div>
            <div className="flex items-center justify-between">
              <TierBadge tier={state.assignedTier} />
              {state.assignedAt && (
                <span className="text-[11px] text-slate-400">{fmtDate(state.assignedAt)}</span>
              )}
            </div>
            {state.assignedBy && (
              <div className="text-[11px] text-slate-500 mt-1">by {state.assignedBy}</div>
            )}
            {state.pmNote && (
              <div className="mt-2 text-xs text-slate-600 italic border-l-2 border-slate-200 pl-2">
                "{state.pmNote}"
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Checklist by category */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Accreditation criteria
          </h2>
          <div className="text-xs text-slate-500">
            {canEditChecklist
              ? `Editing as ${roleLabel}`
              : `Read-only for ${roleLabel}`}
          </div>
        </div>

        {CATEGORIES.map(cat => {
          const c = perCategory[cat.id]
          const p = c.possible ? Math.round((c.earned / c.possible) * 100) : 0
          return (
            <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{cat.label}</h3>
                  <p className="text-xs text-slate-500">{cat.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800 tabular-nums">{c.earned}/{c.possible}</div>
                  <div className="text-[11px] text-slate-500">{p}%</div>
                </div>
              </div>
              <ul className="divide-y divide-slate-100">
                {cat.criteria.map(cr => {
                  const checked = !!state.answers[cr.id]
                  const ev = evidence[cr.id]
                  return (
                    <li key={cr.id} className="py-2.5">
                      <label className={`flex items-start gap-3 ${canEditChecklist ? 'cursor-pointer' : 'cursor-default'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canEditChecklist}
                          onChange={() => toggleCriterion(cr.id)}
                          className="mt-1 accent-brand-600 disabled:opacity-50"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-slate-800">{cr.label}</span>
                            <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${TIER_COLOR[cr.tier].bg} ${TIER_COLOR[cr.tier].text}`}>
                              {TIER_LABEL[cr.tier]}
                            </span>
                            <span className="text-[11px] text-slate-400">+{cr.weight} pts</span>
                          </div>
                          {cr.hint && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{cr.hint}</div>
                          )}
                          {ev && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              <Info size={11} /> {ev}
                            </div>
                          )}
                        </div>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </section>

      {/* PM actions */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className="text-brand-600" />
          <h3 className="text-sm font-semibold text-slate-900">Program Manager actions</h3>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">
          Final tier assignment and publication are restricted to the Program Manager.
          You are viewing as <span className="font-medium text-slate-700">{roleLabel}</span>.
        </p>

        {!reviewedOk && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
            Diagnostic must be <strong>approved</strong> in Review & Workflow before a tier can be assigned.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Textarea
              value={pmDraftNote}
              onChange={e => setPmDraftNote(e.target.value)}
              placeholder="Optional note that will be attached to the tier assignment…"
              className="min-h-[70px]"
              disabled={!canAssignTier}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {(['essential','advanced','elite'] as Tier[]).map(t => (
                <Button
                  key={t}
                  variant={state.assignedTier === t ? 'primary' : 'secondary'}
                  disabled={!canAssignTier}
                  onClick={() => assignTier(t)}
                >
                  <BadgeCheck size={14} /> Assign {TIER_LABEL[t]}
                </Button>
              ))}
              {canReset && state.assignedTier !== 'none' && (
                <Button variant="ghost" onClick={resetAccreditation}>
                  <RotateCcw size={14} /> Reset
                </Button>
              )}
            </div>
            {canAssignTier && proposedTier !== 'none' && state.assignedTier !== proposedTier && (
              <div className="mt-2 text-[11px] text-slate-500">
                Suggested by checklist: <strong>{TIER_LABEL[proposedTier]}</strong>.
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Publication</div>
            <div className="text-sm text-slate-700 mb-3">
              {state.published
                ? <>Visible on partner directory since {fmtDate(state.publishedAt)}.</>
                : <>Not yet published.</>}
            </div>
            {state.published
              ? <Button variant="secondary" onClick={unpublish} disabled={role !== 'program_manager'} className="w-full">
                  <Globe size={14} /> Unpublish
                </Button>
              : <Button onClick={publish} disabled={!canPublish} className="w-full">
                  <Globe size={14} /> Publish accreditation
                </Button>}
            {!canPublish && !state.published && (
              <div className="text-[11px] text-slate-500 mt-2">
                Assign a tier before publishing.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

// Suppress unused warning for an exported helper kept for future emissions-driven hints
void electricityEmissionsTons
