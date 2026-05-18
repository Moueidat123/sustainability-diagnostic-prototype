export type Role =
  | 'partner'
  | 'reviewer'
  | 'program_manager'
  | 'admin'
  | 'viewer'

export const ROLES: { id: Role; label: string; description: string }[] = [
  { id: 'partner', label: 'Partner / SME', description: 'Submit company & sustainability data' },
  { id: 'reviewer', label: 'Reviewer / Consultant', description: 'Review submissions & request changes' },
  { id: 'program_manager', label: 'Program Manager', description: 'Approve stages, assign tiers' },
  { id: 'admin', label: 'System Admin', description: 'Manage users, factors, master data' },
  { id: 'viewer', label: 'Management Viewer', description: 'View dashboards & reports' },
]
