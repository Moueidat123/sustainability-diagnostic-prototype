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
  name: '',
  legalEntity: '',
  sector: '',
  country: '',
  reportingYear: '2025',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  description: '',
}

export type Site = {
  id: string
  name: string
  city: string
  country: string
  ownership: string
  floorArea: number | ''
}

/** Storage keys (single source of truth) */
export const KEYS = {
  company: 'sdp.company',
  sites: 'sdp.sites',
} as const

/** % of required Company fields completed (0-100) */
export function companyCompletion(c: Company): number {
  const required: (keyof Company)[] = [
    'name', 'legalEntity', 'sector', 'country',
    'reportingYear', 'contactName', 'contactEmail',
  ]
  const filled = required.filter(k => String(c[k] ?? '').trim() !== '').length
  return Math.round((filled / required.length) * 100)
}
