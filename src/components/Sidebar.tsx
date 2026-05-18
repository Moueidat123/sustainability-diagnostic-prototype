import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, MapPin, Flame, Truck,
  Zap, ClipboardCheck, Settings, FileBarChart, Award,
} from 'lucide-react'
import clsx from 'clsx'
import type { Role } from '../lib/roles'

type Item = { to: string; label: string; icon: React.ComponentType<{ size?: number }>; roles: Role[] }

const ITEMS: Item[] = [
  { to: '/',                 label: 'Dashboard',         icon: LayoutDashboard,  roles: ['partner','reviewer','program_manager','admin','viewer'] },
  { to: '/company',          label: 'Company Profile',   icon: Building2,        roles: ['partner','reviewer','program_manager'] },
  { to: '/sites',            label: 'Sites',             icon: MapPin,           roles: ['partner','reviewer','program_manager'] },
  { to: '/scope1-fuels',     label: 'Scope 1 – Fuels',   icon: Flame,            roles: ['partner','reviewer','program_manager'] },
  { to: '/scope1-fleet',     label: 'Scope 1 – Fleet',   icon: Truck,            roles: ['partner','reviewer','program_manager'] },
  { to: '/scope2-electricity', label: 'Scope 2 – Electricity', icon: Zap,        roles: ['partner','reviewer','program_manager'] },
  { to: '/review',           label: 'Review & Workflow', icon: ClipboardCheck,   roles: ['reviewer','program_manager'] },
  { to: '/accreditation',    label: 'Accreditation',     icon: Award,            roles: ['program_manager','reviewer'] },
  { to: '/reports',          label: 'Reports & Export',  icon: FileBarChart,     roles: ['partner','reviewer','program_manager','viewer'] },
  { to: '/admin',            label: 'Admin',             icon: Settings,         roles: ['admin'] },
]

export default function Sidebar({ role }: { role: Role }) {
  const items = ITEMS.filter(i => i.roles.includes(role))
  return (
    <aside className="w-64 shrink-0 bg-brand-800 text-brand-50 flex flex-col">
      <div className="px-5 py-5 border-b border-brand-700">
        <div className="text-xs uppercase tracking-wider text-brand-300">Aramco</div>
        <div className="text-xl font-semibold text-white">Taleed</div>
        <div className="text-[11px] text-brand-200 mt-1">Sustainability Diagnostic</div>
      </div>
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
                  ? 'bg-brand-600 text-white'
                  : 'text-brand-100 hover:bg-brand-700 hover:text-white'
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 text-[11px] text-brand-300 border-t border-brand-700">
        Prototype v0.1 · {new Date().getFullYear()}
      </div>
    </aside>
  )
}
