import { useEffect, useState } from 'react'
import {
  Settings, Lock, Save, RotateCcw, Search, Users as UsersIcon,
  Database, Flame, Zap, Target, ListChecks, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { useRole } from '../lib/useRole'
import { ROLES, type Role } from '../lib/roles'
import { Button, Input, Select, Field } from '../components/ui'
import {
  FUEL_FACTORS, VEHICLE_FUELS, GRID_FACTORS,
  FUEL_FACTOR_VERSION, GRID_FACTOR_VERSION,
} from '../lib/emissionFactors'
import { SECTOR_BENCHMARKS } from '../lib/benchmarks'
import { COUNTRIES, SECTORS, OWNERSHIP_TYPES, REPORTING_YEARS } from '../lib/masterData'
import {
  ADMIN_KEYS, DEFAULT_USERS, fuelOverride, gridOverride, benchmarkOverride,
  type AdminUser,
} from '../lib/adminOverrides'
import { useLocalState, uid } from '../lib/storage'

type Tab = 'fuels' | 'grid' | 'benchmarks' | 'master' | 'users'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'fuels',      label: 'Fuel emission factors', icon: Flame },
  { id: 'grid',       label: 'Grid factors',          icon: Zap },
  { id: 'benchmarks', label: 'Sector benchmarks',     icon: Target },
  { id: 'master',     label: 'Master lists',          icon: Database },
  { id: 'users',      label: 'Users & permissions',   icon: UsersIcon },
]

// ----- Hook that wraps localStorage maps with React state + an in-tab event -----
function useOverrideMap(get: () => Record<string, number>, set: (m: Record<string, number>) => void, refreshKey: string) {
  const [map, setMap] = useState<Record<string, number>>(() => get())
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>
      if (ce.detail?.key === refreshKey) setMap(get())
    }
    window.addEventListener('sdp:storage', handler as EventListener)
    return () => window.removeEventListener('sdp:storage', handler as EventListener)
  }, [refreshKey, get])
  const update = (k: string, v: number | undefined) => {
    const next = { ...map }
    if (v === undefined || !Number.isFinite(v)) delete next[k]
    else next[k] = v
    setMap(next); set(next)
  }
  const resetAll = () => { setMap({}); set({}) }
  return { map, update, resetAll }
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
      <Lock size={18} className="text-red-600" />
      <div className="text-sm text-red-800">{children}</div>
    </div>
  )
}

export default function Admin() {
  const { role } = useRole()
  const isAdmin = role === 'admin'
  const [tab, setTab] = useState<Tab>('fuels')
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  // Persisted overrides
  const fuels = useOverrideMap(fuelOverride.get, fuelOverride.set, ADMIN_KEYS.fuelFactors)
  const grid  = useOverrideMap(gridOverride.get, gridOverride.set, ADMIN_KEYS.gridFactors)
  const bench = useOverrideMap(benchmarkOverride.get, benchmarkOverride.set, ADMIN_KEYS.sectorBenchmarks)

  // Users (mock CRUD)
  const [users, setUsers] = useLocalState<AdminUser[]>(ADMIN_KEYS.users, DEFAULT_USERS)
  const [draftUser, setDraftUser] = useState<AdminUser>({
    id: '', name: '', email: '', role: 'partner', active: true,
  })

  function flash(msg: string) {
    setToast(msg); setTimeout(() => setToast(null), 1800)
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
            <Settings size={14} /> Admin
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">System administration</h1>
        </div>
        <Banner>
          The Admin module is restricted to <strong>System Admin</strong> users.
          You are currently viewing as <strong>{ROLES.find(r => r.id === role)?.label}</strong>.
          <div className="text-xs text-red-700 mt-1">
            Switch role from the dropdown in the top-right header to preview admin features.
          </div>
        </Banner>
      </div>
    )
  }

  const allFuels = [...FUEL_FACTORS, ...VEHICLE_FUELS]
    .filter(f => f.label.toLowerCase().includes(query.toLowerCase()) || f.id.includes(query.toLowerCase()))

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
            <Settings size={14} /> Admin
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">System administration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage emission factors, sector benchmarks, master lists and users. Overrides apply immediately to all calculations.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <CheckCircle2 size={12} /> Admin access
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex flex-wrap gap-1">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition ${
                  active
                    ? 'border-brand-600 text-brand-700 font-medium'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ===== FUEL FACTORS ===== */}
      {tab === 'fuels' && (
        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Fuel emission factors</h2>
              <p className="text-xs text-slate-500">Defaults: {FUEL_FACTOR_VERSION}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Search fuels…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="pl-8 w-40 sm:w-56"
                />
              </div>
              <Button variant="ghost" onClick={() => { fuels.resetAll(); flash('All fuel overrides cleared.') }}>
                <RotateCcw size={14} /> Reset all
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto -mx-1"><table className="w-full text-sm min-w-[560px]">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="text-left py-2">Fuel</th>
                <th className="text-left">Category</th>
                <th className="text-left">Unit</th>
                <th className="text-right">Default</th>
                <th className="text-right">Active (kgCO₂e / unit)</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allFuels.map(f => {
                const ov = fuels.map[f.id]
                const active = Number.isFinite(ov) ? ov : f.kgCO2ePerUnit
                const overridden = Number.isFinite(ov)
                return (
                  <tr key={f.id} className={overridden ? 'bg-amber-50/40' : ''}>
                    <td className="py-2 text-slate-800">{f.label}<div className="text-[11px] text-slate-400">{f.id}</div></td>
                    <td className="text-slate-600">{f.category}</td>
                    <td className="text-slate-600">{f.unit}</td>
                    <td className="text-right tabular-nums text-slate-500">{f.kgCO2ePerUnit}</td>
                    <td className="text-right">
                      <Input
                        type="number" step="0.001" min="0"
                        defaultValue={active}
                        onBlur={e => {
                          const v = parseFloat(e.target.value)
                          if (!Number.isFinite(v) || v === f.kgCO2ePerUnit) { fuels.update(f.id, undefined); flash(`Reverted ${f.label} to default.`) }
                          else { fuels.update(f.id, v); flash(`Updated ${f.label} → ${v}`) }
                        }}
                        className="w-28 text-right ml-auto"
                      />
                    </td>
                    <td className="text-right">
                      {overridden
                        ? <button onClick={() => { fuels.update(f.id, undefined); flash(`Reverted ${f.label}.`) }}
                                  className="text-xs text-slate-500 hover:text-red-600">Revert</button>
                        : <span className="text-[11px] text-slate-400">default</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
          <p className="text-[11px] text-slate-500 mt-3">
            Tip: edit a value and press <kbd>Tab</kbd> to save. Set it equal to the default to clear the override.
          </p>
        </section>
      )}

      {/* ===== GRID FACTORS ===== */}
      {tab === 'grid' && (
        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Grid electricity factors</h2>
              <p className="text-xs text-slate-500">Defaults: {GRID_FACTOR_VERSION}</p>
            </div>
            <Button variant="ghost" onClick={() => { grid.resetAll(); flash('All grid overrides cleared.') }}>
              <RotateCcw size={14} /> Reset all
            </Button>
          </div>
          <div className="overflow-x-auto -mx-1"><table className="w-full text-sm min-w-[560px]">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="text-left py-2">Country</th>
                <th className="text-right">Default (kgCO₂e/kWh)</th>
                <th className="text-right">Active</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(GRID_FACTORS).map(([country, def]) => {
                const ov = grid.map[country]
                const overridden = Number.isFinite(ov)
                const active = overridden ? ov : def
                return (
                  <tr key={country} className={overridden ? 'bg-amber-50/40' : ''}>
                    <td className="py-2 text-slate-800">{country}</td>
                    <td className="text-right tabular-nums text-slate-500">{def}</td>
                    <td className="text-right">
                      <Input
                        type="number" step="0.001" min="0"
                        defaultValue={active}
                        onBlur={e => {
                          const v = parseFloat(e.target.value)
                          if (!Number.isFinite(v) || v === def) { grid.update(country, undefined); flash(`Reverted ${country}.`) }
                          else { grid.update(country, v); flash(`Updated ${country} → ${v}`) }
                        }}
                        className="w-28 text-right ml-auto"
                      />
                    </td>
                    <td className="text-right">
                      {overridden
                        ? <button onClick={() => { grid.update(country, undefined); flash(`Reverted ${country}.`) }}
                                  className="text-xs text-slate-500 hover:text-red-600">Revert</button>
                        : <span className="text-[11px] text-slate-400">default</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        </section>
      )}

      {/* ===== BENCHMARKS ===== */}
      {tab === 'benchmarks' && (
        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Sector benchmarks (tCO₂e / company / year)</h2>
              <p className="text-xs text-slate-500">Used by the Dashboard "Sector benchmark" chart.</p>
            </div>
            <Button variant="ghost" onClick={() => { bench.resetAll(); flash('Benchmarks reset.') }}>
              <RotateCcw size={14} /> Reset all
            </Button>
          </div>
          <div className="overflow-x-auto -mx-1"><table className="w-full text-sm min-w-[560px]">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="text-left py-2">Sector</th>
                <th className="text-right">Default</th>
                <th className="text-right">Active</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(SECTOR_BENCHMARKS).map(([sector, def]) => {
                const ov = bench.map[sector]
                const overridden = Number.isFinite(ov)
                const active = overridden ? ov : def
                return (
                  <tr key={sector} className={overridden ? 'bg-amber-50/40' : ''}>
                    <td className="py-2 text-slate-800">{sector}</td>
                    <td className="text-right tabular-nums text-slate-500">{def}</td>
                    <td className="text-right">
                      <Input
                        type="number" step="1" min="0"
                        defaultValue={active}
                        onBlur={e => {
                          const v = parseFloat(e.target.value)
                          if (!Number.isFinite(v) || v === def) { bench.update(sector, undefined); flash(`Reverted ${sector}.`) }
                          else { bench.update(sector, v); flash(`Updated ${sector} → ${v}`) }
                        }}
                        className="w-28 text-right ml-auto"
                      />
                    </td>
                    <td className="text-right">
                      {overridden
                        ? <button onClick={() => { bench.update(sector, undefined); flash(`Reverted ${sector}.`) }}
                                  className="text-xs text-slate-500 hover:text-red-600">Revert</button>
                        : <span className="text-[11px] text-slate-400">default</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        </section>
      )}

      {/* ===== MASTER LISTS ===== */}
      {tab === 'master' && (
        <section className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Master lists (read-only in prototype)</h2>
            <p className="text-xs text-slate-500 mb-3">
              These controlled vocabularies will be CRUD-editable in the production Statamic build.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Countries',       items: COUNTRIES,       icon: ListChecks },
                { label: 'Sectors',         items: SECTORS,         icon: ListChecks },
                { label: 'Ownership types', items: OWNERSHIP_TYPES, icon: ListChecks },
                { label: 'Reporting years', items: REPORTING_YEARS, icon: ListChecks },
              ].map(g => (
                <div key={g.label} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-slate-800">{g.label}</div>
                    <span className="text-[11px] text-slate-400">{g.items.length} items</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-0.5 max-h-48 overflow-y-auto">
                    {g.items.map(i => <li key={i} className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-slate-300" /> {i}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== USERS ===== */}
      {tab === 'users' && (
        <section className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Users & permissions</h2>
            <div className="overflow-x-auto -mx-1"><table className="w-full text-sm min-w-[560px]">
              <thead className="text-xs text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Role</th>
                  <th className="text-center">Active</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="py-2 text-slate-800">{u.name}</td>
                    <td className="text-slate-600">{u.email}</td>
                    <td>
                      <Select
                        value={u.role}
                        onChange={e => setUsers(prev => prev.map(p => p.id === u.id ? { ...p, role: e.target.value as Role } : p))}
                        className="w-44"
                      >
                        {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </Select>
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={u.active}
                        onChange={e => setUsers(prev => prev.map(p => p.id === u.id ? { ...p, active: e.target.checked } : p))}
                        className="accent-brand-600"
                      />
                    </td>
                    <td className="text-right">
                      <button onClick={() => { setUsers(prev => prev.filter(p => p.id !== u.id)); flash(`Removed ${u.name}.`) }}
                              className="text-xs text-slate-500 hover:text-red-600">Remove</button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-xs text-slate-400 italic">No users.</td></tr>
                )}
              </tbody>
            </table></div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <AlertCircle size={12} /> Changes are persisted locally only — this is a UI prototype, not a real auth backend.
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Invite user</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <Field label="Full name" required>
                <Input value={draftUser.name} onChange={e => setDraftUser(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Ahmed Al-Fares" />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={draftUser.email} onChange={e => setDraftUser(d => ({ ...d, email: e.target.value }))} placeholder="user@example.com" />
              </Field>
              <Field label="Role">
                <Select value={draftUser.role} onChange={e => setDraftUser(d => ({ ...d, role: e.target.value as Role }))}>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </Select>
              </Field>
              <Button
                onClick={() => {
                  if (!draftUser.name.trim() || !draftUser.email.trim()) { flash('Name and email are required.'); return }
                  const u: AdminUser = { ...draftUser, id: uid(), active: true }
                  setUsers(prev => [...prev, u])
                  setDraftUser({ id: '', name: '', email: '', role: 'partner', active: true })
                  flash(`Invited ${u.name} as ${ROLES.find(r => r.id === u.role)?.label}.`)
                }}
              >
                <Save size={14} /> Add user
              </Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Permissions matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2">Capability</th>
                    {ROLES.map(r => <th key={r.id} className="text-center px-2">{r.label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['Enter diagnostic data', { partner: true, reviewer: false, program_manager: true, admin: false, viewer: false }],
                    ['Comment on submissions', { partner: true, reviewer: true, program_manager: true, admin: false, viewer: false }],
                    ['Approve submissions',    { partner: false, reviewer: false, program_manager: true, admin: false, viewer: false }],
                    ['Assign accreditation tier', { partner: false, reviewer: false, program_manager: true, admin: false, viewer: false }],
                    ['Edit emission factors',  { partner: false, reviewer: false, program_manager: false, admin: true, viewer: false }],
                    ['Manage users',           { partner: false, reviewer: false, program_manager: false, admin: true, viewer: false }],
                    ['View dashboards',        { partner: true, reviewer: true, program_manager: true, admin: true, viewer: true }],
                  ].map(([cap, perms]) => (
                    <tr key={cap as string}>
                      <td className="py-2 text-slate-800">{cap as string}</td>
                      {ROLES.map(r => (
                        <td key={r.id} className="text-center">
                          {(perms as Record<string, boolean>)[r.id]
                            ? <CheckCircle2 size={14} className="inline text-emerald-600" />
                            : <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
        <div className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md shadow-lg">{toast}</div>
      </div>
    </div>
  )
}
