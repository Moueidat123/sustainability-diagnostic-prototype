export type Company = {
  name: string
  legalEntity: string
  sector: string
  country: string
  reportingYear: string
  contactName: string
  contactEmail: string
  contactPhone: string
  description: string
}

export const EMPTY_COMPANY: Company = {
  name: '', legalEntity: '', sector: '', country: '',
  reportingYear: '2025', contactName: '', contactEmail: '',
  contactPhone: '', description: '',
}

export type Site = {
  id: string
  name: string
  city: string
  country: string
  ownership: string
  floorArea: number | ''
}

export type FuelEntry = {
  id: string
  siteId: string
  fuelId: string
  quantity: number | ''
  note?: string
}

export type FleetEntry = {
  id: string
  siteId: string
  vehicleType: string
  fuelId: string
  vehicleCount: number | ''
  mode: 'fuel' | 'distance'
  quantity: number | ''
  kmDriven: number | ''
  consumptionPer100km: number | ''
  note?: string
}

export type ElectricityEntry = {
  id: string
  siteId: string
  country: string
  gridKwh: number | ''
  purchasedRenewableKwh: number | ''
  onsiteRenewableKwh: number | ''
  note?: string
}

export const KEYS = {
  company: 'sdp.company',
  sites: 'sdp.sites',
  fuels: 'sdp.fuels',
  fleet: 'sdp.fleet',
  electricity: 'sdp.electricity',
  workflow: 'sdp.workflow',
  accreditation: 'sdp.accreditation',
} as const

export function companyCompletion(c: Company): number {
  const required: (keyof Company)[] = [
    'name','legalEntity','sector','country','reportingYear','contactName','contactEmail',
  ]
  const filled = required.filter(k => String(c[k] ?? '').trim() !== '').length
  return Math.round((filled / required.length) * 100)
}

// ---------- Review & Workflow ----------

export type WorkflowStatus = 'draft' | 'submitted' | 'changes_requested' | 'approved'

export type ReviewSection =
  | 'company' | 'sites' | 'fuels' | 'fleet' | 'electricity' | 'general'

export type ReviewComment = {
  id: string
  section: ReviewSection
  author: string       // role id
  authorLabel: string  // friendly label
  text: string
  ts: number
  resolved?: boolean
}

export type WorkflowEvent = {
  id: string
  ts: number
  actor: string
  actorLabel: string
  type:
    | 'submitted'
    | 'changes_requested'
    | 'approval_recommended'
    | 'approved'
    | 'reopened'
    | 'comment'
  note?: string
}

export type Workflow = {
  status: WorkflowStatus
  submittedAt?: number
  approvedAt?: number
  comments: ReviewComment[]
  events: WorkflowEvent[]
}

export const EMPTY_WORKFLOW: Workflow = {
  status: 'draft',
  comments: [],
  events: [],
}

export const STATUS_LABEL: Record<WorkflowStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted for review',
  changes_requested: 'Changes requested',
  approved: 'Approved',
}
