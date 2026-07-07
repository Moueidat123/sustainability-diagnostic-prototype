import { ChevronDown, UserCircle2, Menu } from 'lucide-react'
import { ROLES, type Role } from '../lib/roles'

export default function Header({
  role,
  setRole,
  onMenuClick,
}: {
  role: Role
  setRole: (r: Role) => void
  onMenuClick?: () => void
}) {
  const current = ROLES.find(r => r.id === role)!
  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between gap-2 px-3 sm:px-6">
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger (mobile/tablet only) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 -ml-1 rounded-md hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <div className="hidden sm:block text-[11px] uppercase tracking-wider text-slate-500 truncate">
            Sustainability Diagnostic & Partner Accreditation
          </div>
          <div className="text-sm font-medium text-slate-800 truncate">
            <span className="hidden sm:inline">Prototype · For client review</span>
            <span className="sm:hidden">Taleed Diagnostic</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="hidden sm:inline text-xs text-slate-500">Viewing as:</span>
        <div className="relative">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="appearance-none pl-9 pr-8 py-1.5 text-sm rounded-md border border-slate-300 bg-white hover:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {ROLES.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <UserCircle2 size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-600 pointer-events-none" />
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="hidden xl:block text-xs text-slate-500 max-w-[220px] truncate">
          {current.description}
        </div>
      </div>
    </header>
  )
}
