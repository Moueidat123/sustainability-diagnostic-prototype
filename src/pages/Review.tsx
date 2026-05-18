import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardCheck, MessageSquare, CheckCircle2, AlertCircle, Clock,
  Send, RotateCcw, ShieldCheck, ArrowRight, Building2, MapPin, Flame,
  Truck, Zap, Trash2, CornerDownRight,
} from 'lucide-react'
import { useLocalState, uid } from '../lib/storage'
import {
  EMPTY_COMPANY, EMPTY_WORKFLOW, KEYS, STATUS_LABEL, companyCompletion,
  type Company, type Site, type FuelEntry, type FleetEntry, type ElectricityEntry,
  type Workflow, type ReviewSection, type WorkflowEvent,
} from '../lib/types'
import { ROLES } from '../lib/roles'
import { useRole } from '../lib/useRole'
import { Button, Textarea } from '../components/ui'

const SECTIONS: {
  key: ReviewSection
  label: string
  to?: string
  icon: React.ComponentType<{ size?: number }>
}[] = [
  { key: 'company',     label: 'Company Profile',       to: '/company',            icon: Building2 },
  { key: 'sites',       label: 'Sites',                 to: '/sites',              icon: MapPin },
  { key: 'fuels',       label: 'Scope 1 – Fuels',       to: '/scope1-fuels',       icon: Flame },
  { key: 'fleet',       label: 'Scope 1 – Fleet',       to: '/scope1-fleet',       icon: Truck },
  { key: 'electricity', label: 'Scope 2 – Electricity', to: '/scope2-electricity', icon: Zap },
  { key: 'general',     label: 'General comments',                                  icon: MessageSquare },
]

function fmtDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function StatusPill({ status }: { status: Workflow['status'] }) {
  const map: Record<Workflow['status'], { bg: string; text: string; dot: string; icon: React.ReactNode }> = {
    draft:             { bg: 'bg-slate-100',   text: 'text-slate-700',   dot: 'bg-slate-400',   icon: <Clock size={12} /> },
    submitted:         { bg: 'bg-amber-50',    text: 'text-amber-800',   dot: 'bg-amber-500',   icon: <Send size={12} /> },
    changes_requested: { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500',     icon: <AlertCircle size={12} /> },
    approved:          { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500', icon: <CheckCircle2 size={12} /> },
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.icon}
      {STATUS_LABEL[status]}
    </span>
  )
}

function EventIcon({ type }: { type: WorkflowEvent['type'] }) {
  switch (type) {
    case 'submitted':            return <Send size={14} className="text-amber-600" />
    case 'changes_requested':    return <AlertCircle size={14} className="text-red-600" />
    case 'approval_recommended': return <ShieldCheck size={14} className="text-brand-600" />
    case 'approved':             return <CheckCircle2 size={14} className="text-emerald-600" />
    case 'reopened':             return <RotateCcw size={14} className="text-slate-500" />
    case 'comment':              return <MessageSquare size={14} className="text-slate-500" />
  }
}

export default function Review() {
  const { role } = useRole()
  const roleLabel = ROLES.find(r => r.id === role)?.label ?? role

  const [company]     = useLocalState<Company>(KEYS.company, EMPTY_COMPANY)
  const [sites]       = useLocalState<Site[]>(KEYS.sites, [])
  const [fuels]       = useLocalState<FuelEntry[]>(KEYS.fuels, [])
  const [fleet]       = useLocalState<FleetEntry[]>(KEYS.fleet, [])
  const [electricity] = useLocalState<ElectricityEntry[]>(KEYS.electricity, [])

  const [wf, setWf] = useLocalState<Workflow>(KEYS.workflow, EMPTY_WORKFLOW)

  const [drafts, setDrafts] = useState<Record<ReviewSection, string>>({
    company: '', sites: '', fuels: '', fleet: '', electricity: '', general: '',
  })
  const [actionNote, setActionNote] = useState('')

  // Section readiness — drives the readiness summary at top
  const readiness = useMemo(() => ({
    company:     { ready: companyCompletion(company) === 100, summary: company.name
                    ? `${companyCompletion(company)}% complete · ${company.sector || 'No sector'}`
                    : 'Not started' },
    sites:       { ready: sites.length > 0,        summary: `${sites.length} site${sites.length === 1 ? '' : 's'}` },
    fuels:       { ready: fuels.length > 0,        summary: `${fuels.length} entr${fuels.length === 1 ? 'y' : 'ies'}` },
    fleet:       { ready: fleet.length > 0,        summary: `${fleet.length} entr${fleet.length === 1 ? 'y' : 'ies'}` },
    electricity: { ready: electricity.length > 0,  summary: `${electricity.length} entr${electricity.length === 1 ? 'y' : 'ies'}` },
    general:     { ready: true,                    summary: 'Cross-cutting feedback' },
  }), [company, sites, fuels, fleet, electricity])

  const readyCount = (['company','sites','fuels','fleet','electricity'] as ReviewSection[])
    .filter(k => readiness[k].ready).length
  const allReady = readyCount === 5

  // ----- mutations -----
  function pushEvent(ev: Omit<WorkflowEvent, 'id' | 'ts' | 'actor' | 'actorLabel'>) {
    setWf(prev => ({
      ...prev,
      events: [
        ...prev.events,
        { id: uid(), ts: Date.now(), actor: role, actorLabel: roleLabel, ...ev },
      ],
    }))
  }

  function addComment(section: ReviewSection) {
    const text = drafts[section].trim()
    if (!text) return
    setWf(prev => ({
      ...prev,
      comments: [
        ...prev.comments,
        { id: uid(), section, author: role, authorLabel: roleLabel, text, ts: Date.now() },
      ],
      events: [
        ...prev.events,
        { id: uid(), ts: Date.now(), actor: role, actorLabel: roleLabel, type: 'comment', note: `on ${section}` },
      ],
    }))
    setDrafts(d => ({ ...d, [section]: '' }))
  }

  function toggleResolved(commentId: string) {
    setWf(prev => ({
      ...prev,
      comments: prev.comments.map(c =>
        c.id === commentId ? { ...c, resolved: !c.resolved } : c
      ),
    }))
  }

  function deleteComment(commentId: string) {
    setWf(prev => ({ ...prev, comments: prev.comments.filter(c => c.id !== commentId) }))
  }

  function submitForReview() {
    setWf(prev => ({ ...prev, status: 'submitted', submittedAt: Date.now() }))
    pushEvent({ type: 'submitted', note: actionNote || undefined })
    setActionNote('')
  }
  function requestChanges() {
    setWf(prev => ({ ...prev, status: 'changes_requested' }))
    pushEvent({ type: 'changes_requested', note: actionNote || undefined })
    setActionNote('')
  }
  function recommendApproval() {
    pushEvent({ type: 'approval_recommended', note: actionNote || undefined })
    setActionNote('')
  }
  function approve() {
    setWf(prev => ({ ...prev, status: 'approved', approvedAt: Date.now() }))
    pushEvent({ type: 'approved', note: actionNote || undefined })
    setActionNote('')
  }
  function reopen() {
    setWf(prev => ({ ...prev, status: 'draft' }))
    pushEvent({ type: 'reopened', note: actionNote || undefined })
    setActionNote('')
  }

  // ----- role-based action sets -----
  const canPartnerSubmit  = role === 'partner' && (wf.status === 'draft' || wf.status === 'changes_requested')
  const canReviewerAct    = role === 'reviewer' && wf.status === 'submitted'
  const canPMApprove      = role === 'program_manager' && wf.status === 'submitted'
  const canReopen         = (role === 'program_manager' || role === 'admin') && wf.status === 'approved'

  const unresolved = wf.comments.filter(c => !c.resolved).length

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
            <ClipboardCheck size={14} /> Review & Workflow
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">
            {company.name ? `${company.name} — ${company.reportingYear}` : 'Diagnostic submission'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track submission status, collect reviewer comments, and route to approval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={wf.status} />
        </div>
      </div>

      {/* Readiness banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Submission readiness</h2>
            <p className="text-xs text-slate-500">
              {readyCount} of 5 modules contain data
              {wf.submittedAt && <> · submitted {fmtDate(wf.submittedAt)}</>}
              {wf.approvedAt && <> · approved {fmtDate(wf.approvedAt)}</>}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-slate-900 tabular-nums">
              {Math.round((readyCount / 5) * 100)}%
            </div>
            <div className="text-[11px] text-slate-500">ready</div>
          </div>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-brand-600 transition-all"
               style={{ width: `${(readyCount / 5) * 100}%` }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {SECTIONS.filter(s => s.key !== 'general').map(s => {
            const r = readiness[s.key]
            const Icon = s.icon
            return (
              <Link key={s.key} to={s.to ?? '#'}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 transition">
                <Icon size={16} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800 truncate">{s.label}</div>
                  <div className="text-[11px] text-slate-500 truncate">{r.summary}</div>
                </div>
                {r.ready
                  ? <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  : <AlertCircle size={14} className="text-amber-500 shrink-0" />}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Two-column: comments per section + timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Section comments
            </h2>
            <span className="text-xs text-slate-500">
              {wf.comments.length} total · {unresolved} open
            </span>
          </div>

          {SECTIONS.map(s => {
            const Icon = s.icon
            const sectionComments = wf.comments.filter(c => c.section === s.key)
            return (
              <div key={s.key} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon size={16} />
                    <h3 className="text-sm font-semibold text-slate-900">{s.label}</h3>
                    {sectionComments.length > 0 && (
                      <span className="text-[11px] text-slate-500">
                        ({sectionComments.length} comment{sectionComments.length === 1 ? '' : 's'})
                      </span>
                    )}
                  </div>
                  {s.to && (
                    <Link to={s.to} className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1">
                      Open module <ArrowRight size={12} />
                    </Link>
                  )}
                </div>

                {sectionComments.length === 0 ? (
                  <div className="text-xs text-slate-400 italic mb-3">No comments yet.</div>
                ) : (
                  <ul className="space-y-2 mb-3">
                    {sectionComments.map(c => (
                      <li key={c.id}
                          className={`rounded-md border px-3 py-2 text-sm ${
                            c.resolved
                              ? 'border-emerald-200 bg-emerald-50/40'
                              : 'border-slate-200 bg-slate-50'
                          }`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <CornerDownRight size={12} />
                            <span className="font-medium text-slate-700">{c.authorLabel}</span>
                            <span>·</span>
                            <span>{fmtDate(c.ts)}</span>
                            {c.resolved && (
                              <span className="ml-1 inline-flex items-center gap-1 text-emerald-700">
                                <CheckCircle2 size={12} /> resolved
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => toggleResolved(c.id)}
                                    className="text-[11px] text-slate-500 hover:text-brand-700 px-1.5 py-0.5 rounded hover:bg-white">
                              {c.resolved ? 'Reopen' : 'Resolve'}
                            </button>
                            {(c.author === role || role === 'admin') && (
                              <button onClick={() => deleteComment(c.id)}
                                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-white"
                                      title="Delete comment">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className={c.resolved ? 'text-slate-500 line-through' : 'text-slate-700'}>
                          {c.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}

                {role === 'viewer' ? (
                  <div className="text-[11px] text-slate-400">Viewer role is read-only.</div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Textarea
                      value={drafts[s.key]}
                      onChange={e => setDrafts(d => ({ ...d, [s.key]: e.target.value }))}
                      placeholder={`Add a comment on ${s.label.toLowerCase()}…`}
                      className="min-h-[60px] flex-1"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => addComment(s.key)}
                      disabled={!drafts[s.key].trim()}
                    >
                      <MessageSquare size={14} /> Post
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </section>

        {/* Timeline + actions */}
        <aside className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Activity</h3>
            {wf.events.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No activity yet.</div>
            ) : (
              <ol className="space-y-3">
                {[...wf.events].reverse().map(ev => (
                  <li key={ev.id} className="flex gap-2.5">
                    <div className="mt-0.5"><EventIcon type={ev.type} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-700">
                        <span className="font-medium">{ev.actorLabel}</span>{' '}
                        <span className="text-slate-500">
                          {{
                            submitted: 'submitted for review',
                            changes_requested: 'requested changes',
                            approval_recommended: 'recommended approval',
                            approved: 'approved the submission',
                            reopened: 'reopened the submission',
                            comment: 'added a comment',
                          }[ev.type]}
                        </span>
                      </div>
                      {ev.note && (
                        <div className="text-[11px] text-slate-500 mt-0.5 italic">“{ev.note}”</div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-0.5">{fmtDate(ev.ts)}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Actions</h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Available actions depend on your role. You are viewing as{' '}
              <span className="font-medium text-slate-700">{roleLabel}</span>.
            </p>

            {(canPartnerSubmit || canReviewerAct || canPMApprove || canReopen) ? (
              <>
                <Textarea
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  placeholder="Optional note (will be attached to this action)…"
                  className="min-h-[60px] mb-3"
                />
                <div className="flex flex-col gap-2">
                  {canPartnerSubmit && (
                    <Button onClick={submitForReview} disabled={!allReady} className="w-full">
                      <Send size={14} /> Submit for review
                    </Button>
                  )}
                  {canPartnerSubmit && !allReady && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                      Complete all 5 modules before submitting.
                    </div>
                  )}

                  {canReviewerAct && (
                    <>
                      <Button variant="secondary" onClick={requestChanges} className="w-full">
                        <AlertCircle size={14} /> Request changes
                      </Button>
                      <Button onClick={recommendApproval} className="w-full">
                        <ShieldCheck size={14} /> Recommend approval
                      </Button>
                    </>
                  )}

                  {canPMApprove && (
                    <>
                      <Button variant="secondary" onClick={requestChanges} className="w-full">
                        <AlertCircle size={14} /> Send back for changes
                      </Button>
                      <Button onClick={approve} className="w-full">
                        <CheckCircle2 size={14} /> Approve submission
                      </Button>
                    </>
                  )}

                  {canReopen && (
                    <Button variant="secondary" onClick={reopen} className="w-full">
                      <RotateCcw size={14} /> Reopen submission
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500">
                No actions available for your role at the current status
                (<span className="font-medium">{STATUS_LABEL[wf.status]}</span>).
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
