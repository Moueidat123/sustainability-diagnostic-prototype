import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, MapPin, Flame, Truck,
  Zap, ClipboardCheck, Settings, FileBarChart, Award,
} from 'lucide-react'
import clsx from 'clsx'
import type { Role } from '../lib/roles'

type Item = { to: string; label: string; icon: React.ComponentType<{ size?: number }>; roles: Role[] }

const ITEMS: Item[] = [
  { to: '/',                   label: 'Dashboard',             icon: LayoutDashboard, roles: ['partner','reviewer','program_manager','admin','viewer'] },
  { to: '/company',            label: 'Company Profile',       icon: Building2,       roles: ['partner','reviewer','program_manager'] },
  { to: '/sites',              label: 'Sites',                 icon: MapPin,          roles: ['partner','reviewer','program_manager'] },
  { to: '/scope1-fuels',       label: 'Scope 1 – Fuels',       icon: Flame,           roles: ['partner','reviewer','program_manager'] },
  { to: '/scope1-fleet',       label: 'Scope 1 – Fleet',       icon: Truck,           roles: ['partner','reviewer','program_manager'] },
  { to: '/scope2-electricity', label: 'Scope 2 – Electricity', icon: Zap,             roles: ['partner','reviewer','program_manager'] },
  { to: '/review',             label: 'Review & Workflow',     icon: ClipboardCheck,  roles: ['reviewer','program_manager'] },
  { to: '/accreditation',      label: 'Accreditation',         icon: Award,           roles: ['program_manager','reviewer'] },
  { to: '/reports',            label: 'Reports & Export',      icon: FileBarChart,    roles: ['partner','reviewer','program_manager','viewer'] },
  { to: '/admin',              label: 'Admin',                 icon: Settings,        roles: ['admin'] },
]

const BASE = import.meta.env.BASE_URL
// Prefer the real PNG once provided, fall back to the temporary SVG placeholder.
const LOGO_CANDIDATES = [`${BASE}logo.png`, `${BASE}logo.svg`]

export default function Sidebar({ role }: { role: Role }) {
  const items = ITEMS.filter(i => i.roles.includes(role))
  const [idx, setIdx] = useState(0)
  const failed = idx >= LOGO_CANDIDATES.length

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-200">
        {!failed ? (
          <img
            src={LOGO_CANDIDATES[idx]}
            alt="Aramco Taleed"
            className="h-9 w-auto"
            onError={() => setIdx(i => i + 1)}
          />
        ) : (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Aramco</div>
            <div className="text-xl font-semibold text-brand-700">Taleed</div>
          </div>
        )}
        <div className="text-[11px] text-slate-400 mt-2">Sustainability Diagnostic</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 text-[11px] text-slate-400 border-t border-slate-200">
        Prototype v0.1 · {new Date().getFullYear()}
      </div>
    </aside>
  )
}
