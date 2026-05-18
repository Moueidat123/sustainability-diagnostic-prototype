import { ChevronDown, UserCircle2 } from 'lucide-react'
import { ROLES, type Role } from '../lib/roles'

export default function Header({
  role,
  setRole,
}: {
  role: Role
  setRole: (r: Role) => void
}) {
  const current = ROLES.find(r => r.id === role)!
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500">
          Sustainability Diagnostic & Partner Accreditation
        </div>
        <div className="text-sm font-medium text-slate-800">
          Prototype · For client review
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">Viewing as:</span>
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
        <div className="hidden md:block text-xs text-slate-500 max-w-[220px] truncate">
          {current.description}
        </div>
      </div>
    </header>
  )
}
