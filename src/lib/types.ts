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

export const KEYS = {
  company: 'sdp.company',
  sites: 'sdp.sites',
  fuels: 'sdp.fuels',
  fleet: 'sdp.fleet',
} as const

export function companyCompletion(c: Company): number {
  const required: (keyof Company)[] = [
    'name','legalEntity','sector','country','reportingYear','contactName','contactEmail',
  ]
  const filled = required.filter(k => String(c[k] ?? '').trim() !== '').length
  return Math.round((filled / required.length) * 100)
}
