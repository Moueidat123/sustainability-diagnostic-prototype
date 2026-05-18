import { Building2, MapPin, Flame, Truck, Zap, FileBarChart, ClipboardCheck, Award, Settings } from 'lucide-react'

const KPIS = [
  { label: 'Total GHG (tCO₂e)',         value: '—', hint: 'Scope 1 + Scope 2' },
  { label: 'Scope 1 emissions',         value: '—', hint: 'Fuels + Fleet' },
  { label: 'Scope 2 emissions',         value: '—', hint: 'Electricity' },
  { label: 'Renewable electricity %',   value: '—', hint: 'Of total electricity' },
]

const MODULES = [
  { icon: Building2,      title: 'Company Profile',     desc: 'Legal entity, sector & contact info.' },
  { icon: MapPin,         title: 'Sites',               desc: 'Locations, ownership, floor area.' },
  { icon: Flame,          title: 'Scope 1 – Fuels',     desc: 'Natural gas, diesel, LPG, propane.' },
  { icon: Truck,          title: 'Scope 1 – Fleet',     desc: 'Owned/leased vehicles & km driven.' },
  { icon: Zap,            title: 'Scope 2 – Electricity', desc: 'Grid, purchased & on-site renewables.' },
  { icon: ClipboardCheck, title: 'Review & Workflow',   desc: 'Submit, review, comment, approve.' },
  { icon: Award,          title: 'Accreditation',       desc: 'Categories, tiers & launch stages.' },
  { icon: FileBarChart,   title: 'Reports & Export',    desc: 'PDF & Excel downloadable reports.' },
  { icon: Settings,       title: 'Admin',               desc: 'Emission factors & master lists.' },
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-xl bg-gradient-to-r from-brand-700 to-brand-600 text-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-brand-200">Aramco Taleed</div>
            <h1 className="text-2xl md:text-3xl font-semibold mt-1">Sustainability Diagnostic & Partner Accreditation</h1>
            <p className="mt-2 text-brand-100 max-w-2xl text-sm md:text-base">
              A guided digital platform that replaces the Carbon Diagnostic Excel workbook —
              data collection, automatic emission calculations, dashboards, review workflow and accreditation.
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

      {/* KPI cards */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Key results</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIS.map(k => (
            <div key={k.label} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">{k.label}</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">{k.value}</div>
              <div className="text-[11px] text-slate-400 mt-1">{k.hint}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">Values appear once you enter data in the modules below.</p>
      </section>

      {/* Modules */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Modules</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-brand-500 hover:shadow-sm transition">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
