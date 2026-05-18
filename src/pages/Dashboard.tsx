import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, MapPin, Flame, Truck, Zap, FileBarChart,
  ClipboardCheck, Award, Settings, ArrowRight, CheckCircle2, Circle, Leaf,
} from 'lucide-react'
import { useLocalState } from '../lib/storage'
import {
  EMPTY_COMPANY, KEYS, companyCompletion,
  type Company, type Site, type FuelEntry, type FleetEntry, type ElectricityEntry,
} from '../lib/types'
import { fuelEmissionsTons, fleetEmissionsTons, electricityEmissionsTons } from '../lib/emissionFactors'

const MODULES = [
  { to: '/company',            icon: Building2,      title: 'Company Profile',       desc: 'Legal entity, sector & contact info.' },
  { to: '/sites',              icon: MapPin,         title: 'Sites',                 desc: 'Locations, ownership, floor area.' },
  { to: '/scope1-fuels',       icon: Flame,          title: 'Scope 1 – Fuels',       desc: 'Natural gas, diesel, LPG, propane.' },
  { to: '/scope1-fleet',       icon: Truck,          title: 'Scope 1 – Fleet',       desc: 'Owned/leased vehicles & km driven.' },
  { to: '/scope2-electricity', icon: Zap,            title: 'Scope 2 – Electricity', desc: 'Grid, purchased & on-site renewables.' },
  { to: '/review',             icon: ClipboardCheck, title: 'Review & Workflow',     desc: 'Submit, review, comment, approve.' },
  { to: '/accreditation',      icon: Award,          title: 'Accreditation',         desc: 'Categories, tiers & launch stages.' },
  { to: '/reports',            icon: FileBarChart,   title: 'Reports & Export',      desc: 'PDF & Excel downloadable reports.' },
  { to: '/admin',              icon: Settings,       title: 'Admin',                 desc: 'Emission factors & master lists.' },
]

function fmt(n: number, digits = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export default function Dashboard() {
  const [company] = useLocalState<Company>(KEYS.company, EMPTY_COMPANY)
  const [sites] = useLocalState<Site[]>(KEYS.sites, [])
  const [fuels] = useLocalState<FuelEntry[]>(KEYS.fuels, [])
  const [fleet] = useLocalState<FleetEntry[]>(KEYS.fleet, [])
  const [electricity] = useLocalState<ElectricityEntry[]>(KEYS.electricity, [])

  const companyPct = companyCompletion(company)
  const sitesDone  = sites.length > 0
  const fuelsDone  = fuels.length > 0
  const fleetDone  = fleet.length > 0
  const elecDone   = electricity.length > 0

  // Scope 1
  const scope1Fuels = useMemo(
    () => fuels.reduce((s, e) => s + fuelEmissionsTons(e.fuelId, Number(e.quantity || 0)), 0),
    [fuels]
  )
  const scope1Fleet = useMemo(
    () => fleet.reduce((s, e) => s + fleetEmissionsTons(
      e.fuelId, e.mode,
      Number(e.quantity || 0),
      Number(e.kmDriven || 0),
      Number(e.consumptionPer100km || 0),
    ), 0),
    [fleet]
  )
  const scope1Total = scope1Fuels + scope1Fleet

  // Scope 2
  const elec = useMemo(() => {
    let grid = 0, purchased = 0, onsite = 0, tons = 0
    electricity.forEach(e => {
      const g = Number(e.gridKwh || 0)
      const p = Number(e.purchasedRenewableKwh || 0)
      const o = Number(e.onsiteRenewableKwh || 0)
      grid += g; purchased += p; onsite += o
      tons += electricityEmissionsTons(e.country, g)
    })
    const totalKwh = grid + purchased + onsite
    const renewablePct = totalKwh > 0 ? ((purchased + onsite) / totalKwh) * 100 : 0
    return { grid, purchased, onsite, totalKwh, tons, renewablePct }
  }, [electricity])

  const scope2Total = elec.tons
  const totalGHG    = scope1Total + scope2Total

  // Highest emitting site (Scope 1 fuels + fleet + Scope 2 electricity)
  const perSite = useMemo(() => {
    const m = new Map<string, number>()
    fuels.forEach(e => {
      m.set(e.siteId, (m.get(e.siteId) ?? 0) + fuelEmissionsTons(e.fuelId, Number(e.quantity || 0)))
    })
    fleet.forEach(e => {
      const t = fleetEmissionsTons(
        e.fuelId, e.mode,
        Number(e.quantity || 0),
        Number(e.kmDriven || 0),
        Number(e.consumptionPer100km || 0),
      )
      m.set(e.siteId, (m.get(e.siteId) ?? 0) + t)
    })
    electricity.forEach(e => {
      const t = electricityEmissionsTons(e.country, Number(e.gridKwh || 0))
      m.set(e.siteId, (m.get(e.siteId) ?? 0) + t)
    })
    return m
  }, [fuels, fleet, electricity])

  const highest = useMemo(() => {
    let bestId: string | null = null
    let bestVal = 0
    perSite.forEach((v, k) => { if (v > bestVal) { bestVal = v; bestId = k } })
    return bestId ? { site: sites.find(s => s.id === bestId), tons: bestVal } : null
  }, [perSite, sites])

  const overallSteps = [
    { label: 'Company profile complete',     done: companyPct === 100, to: '/company' },
    { label: 'At least one site added',      done: sitesDone,          to: '/sites' },
    { label: 'Scope 1 fuels entered',        done: fuelsDone,          to: '/scope1-fuels' },
    { label: 'Scope 1 fleet entered',        done: fleetDone,          to: '/scope1-fleet' },
    { label: 'Scope 2 electricity entered',  done: elecDone,           to: '/scope2-electricity' },
  ]
  const overallPct = Math.round((overallSteps.filter(s => s.done).length / overallSteps.length) * 100)

  const KPIS = [
    { label: 'Total GHG (tCO₂e)',       value: totalGHG    > 0 ? fmt(totalGHG)    : '—', hint: 'Scope 1 + Scope 2' },
    { label: 'Scope 1 emissions',       value: scope1Total > 0 ? fmt(scope1Total) : '—', hint: 'Fuels + Fleet' },
    { label: 'Scope 2 emissions',       value: scope2Total > 0 ? fmt(scope2Total) : '—', hint: 'Electricity' },
    { label: 'Renewable electricity %', value: elec.totalKwh > 0 ? `${fmt(elec.renewablePct, 1)}%` : '—', hint: 'Of total electricity' },
  ]

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-xl bg-gradient-to-r from-brand-700 to-brand-600 text-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-brand-200">Aramco Taleed</div>
            <h1 className="text-2xl md:text-3xl font-semibold mt-1">
              {company.name ? company.name : 'Sustainability Diagnostic & Partner Accreditation'}
            </h1>
            <p className="mt-2 text-brand-100 max-w-2xl text-sm md:text-base">
              {company.name
                ? `Reporting year ${company.reportingYear} · ${company.sector || 'Sector not set'} · ${company.country || 'Country not set'}`
                : 'A guided digital platform that replaces the Carbon Diagnostic Excel workbook — data collection, automatic emission calculations, dashboards, review workflow and accreditation.'}
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-accent-500"></span>
              Prototype · For client approval
            </span>
          </div>
        </div>
      </section>

      {/* Progress checklist */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Diagnostic progress</h2>
            <p className="text-xs text-slate-500">Complete each step to enable the full calculation and submission.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-slate-900 tabular-nums">{overallPct}%</div>
            <div className="text-[11px] text-slate-500">overall completion</div>
          </div>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${overallPct}%` }} />
        </div>
        <ul className="divide-y divide-slate-100">
          {overallSteps.map(s => (
            <li key={s.label}>
              <Link to={s.to} className="flex items-center justify-between py-2.5 group">
                <span className="flex items-center gap-2 text-sm">
                  {s.done
                    ? <CheckCircle2 size={16} className="text-brand-600" />
                    : <Circle size={16} className="text-slate-300" />}
                  <span className={s.done ? 'text-slate-700' : 'text-slate-500'}>{s.label}</span>
                </span>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-600 transition" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* KPI cards */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Key results</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIS.map(k => (
            <div key={k.label} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">{k.label}</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{k.value}</div>
              <div className="text-[11px] text-slate-400 mt-1">{k.hint}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Highest emitting site */}
      {highest && highest.site && (
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500">Highest emitting site</div>
          <div className="mt-1 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-900">{highest.site.name}</div>
              <div className="text-xs text-slate-500">{highest.site.city}, {highest.site.country}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-brand-700 tabular-nums">{fmt(highest.tons)}</div>
              <div className="text-[11px] text-slate-500">tCO₂e total</div>
            </div>
          </div>
        </section>
      )}

      {/* Quick stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/company" className="bg-white border border-slate-200 rounded-lg p-5 hover:border-brand-500 hover:shadow-sm transition flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Company profile</div>
            <div className="text-lg font-semibold text-slate-900 mt-1">{company.name || 'Not started'}</div>
            <div className="text-xs text-slate-500 mt-0.5">{companyPct}% complete</div>
          </div>
          <ArrowRight size={18} className="text-slate-300" />
        </Link>
        <Link to="/sites" className="bg-white border border-slate-200 rounded-lg p-5 hover:border-brand-500 hover:shadow-sm transition flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Sites</div>
            <div className="text-lg font-semibold text-slate-900 mt-1">
              {sites.length === 0 ? 'No sites yet' : `${sites.length} site${sites.length === 1 ? '' : 's'}`}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {sites.slice(0, 3).map(s => s.name).join(' · ') || 'Add your first site'}
            </div>
          </div>
          <ArrowRight size={18} className="text-slate-300" />
        </Link>
        <Link to="/scope1-fuels" className="bg-white border border-slate-200 rounded-lg p-5 hover:border-brand-500 hover:shadow-sm transition flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Scope 1</div>
            <div className="text-lg font-semibold text-slate-900 mt-1 tabular-nums">
              {scope1Total > 0 ? `${fmt(scope1Total)} tCO₂e` : 'No data'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{fuels.length} fuel · {fleet.length} fleet</div>
          </div>
          <ArrowRight size={18} className="text-slate-300" />
        </Link>
        <Link to="/scope2-electricity" className="bg-white border border-slate-200 rounded-lg p-5 hover:border-brand-500 hover:shadow-sm transition flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1">
              Scope 2 {elec.renewablePct > 0 && <Leaf size={11} className="text-emerald-600" />}
            </div>
            <div className="text-lg font-semibold text-slate-900 mt-1 tabular-nums">
              {scope2Total > 0 ? `${fmt(scope2Total)} tCO₂e` : 'No data'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {elec.totalKwh > 0
                ? `${fmt(elec.totalKwh, 0)} kWh · ${fmt(elec.renewablePct, 1)}% renewable`
                : 'No entries'}
            </div>
          </div>
          <ArrowRight size={18} className="text-slate-300" />
        </Link>
      </section>

      {/* Modules */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Modules</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map(({ to, icon: Icon, title, desc }) => (
            <Link key={title} to={to} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-brand-500 hover:shadow-sm transition">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
