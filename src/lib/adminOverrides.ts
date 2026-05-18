// Admin-managed overrides, persisted to localStorage.
// All getters fall back to the built-in defaults if there is no override.

export const ADMIN_KEYS = {
  fuelFactors:       'sdp.admin.fuelFactors',       // Record<string, number>
  gridFactors:       'sdp.admin.gridFactors',       // Record<string, number>
  sectorBenchmarks:  'sdp.admin.sectorBenchmarks',  // Record<string, number>
  users:             'sdp.admin.users',             // User[]
} as const

export type AdminUser = {
  id: string
  name: string
  email: string
  role: 'partner' | 'reviewer' | 'program_manager' | 'admin' | 'viewer'
  active: boolean
}

function readMap(key: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch { return {} }
}
function writeMap(key: string, m: Record<string, number>) {
  localStorage.setItem(key, JSON.stringify(m))
  window.dispatchEvent(new CustomEvent('sdp:storage', { detail: { key } }))
}

export const fuelOverride = {
  get: () => readMap(ADMIN_KEYS.fuelFactors),
  set: (m: Record<string, number>) => writeMap(ADMIN_KEYS.fuelFactors, m),
}
export const gridOverride = {
  get: () => readMap(ADMIN_KEYS.gridFactors),
  set: (m: Record<string, number>) => writeMap(ADMIN_KEYS.gridFactors, m),
}
export const benchmarkOverride = {
  get: () => readMap(ADMIN_KEYS.sectorBenchmarks),
  set: (m: Record<string, number>) => writeMap(ADMIN_KEYS.sectorBenchmarks, m),
}

export const DEFAULT_USERS: AdminUser[] = [
  { id: 'u1', name: 'Sara Al-Mutairi',  email: 'sara.almutairi@example.com',  role: 'partner',         active: true },
  { id: 'u2', name: 'Omar Khalil',       email: 'omar.khalil@example.com',     role: 'reviewer',        active: true },
  { id: 'u3', name: 'Hala Ahmed',        email: 'hala.ahmed@example.com',      role: 'program_manager', active: true },
  { id: 'u4', name: 'Faisal Saleh',      email: 'faisal.saleh@example.com',    role: 'admin',           active: true },
  { id: 'u5', name: 'Noura Al-Otaibi',   email: 'noura.alotaibi@example.com',  role: 'viewer',          active: false },
]
