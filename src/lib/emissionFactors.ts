export type FuelUnit = 'litre' | 'm3' | 'kg' | 'kWh'

export type FuelFactor = {
  id: string
  label: string
  unit: FuelUnit
  kgCO2ePerUnit: number
  category: 'Stationary' | 'Mobile'
}

export const FUEL_FACTORS: FuelFactor[] = [
  { id: 'natural_gas_m3',  label: 'Natural gas',                  unit: 'm3',    kgCO2ePerUnit: 2.02,  category: 'Stationary' },
  { id: 'natural_gas_kwh', label: 'Natural gas (metered kWh)',    unit: 'kWh',   kgCO2ePerUnit: 0.183, category: 'Stationary' },
  { id: 'diesel_l',        label: 'Diesel (heating / generator)', unit: 'litre', kgCO2ePerUnit: 2.68,  category: 'Stationary' },
  { id: 'lpg_l',           label: 'LPG',                          unit: 'litre', kgCO2ePerUnit: 1.56,  category: 'Stationary' },
  { id: 'lpg_kg',          label: 'LPG (by mass)',                unit: 'kg',    kgCO2ePerUnit: 2.94,  category: 'Stationary' },
  { id: 'propane_l',       label: 'Propane',                      unit: 'litre', kgCO2ePerUnit: 1.54,  category: 'Stationary' },
  { id: 'fuel_oil_l',      label: 'Fuel oil',                     unit: 'litre', kgCO2ePerUnit: 3.19,  category: 'Stationary' },
  { id: 'kerosene_l',      label: 'Kerosene',                     unit: 'litre', kgCO2ePerUnit: 2.54,  category: 'Stationary' },
]

export const VEHICLE_FUELS: FuelFactor[] = [
  { id: 'petrol_l',     label: 'Petrol / Gasoline', unit: 'litre', kgCO2ePerUnit: 2.31, category: 'Mobile' },
  { id: 'diesel_veh_l', label: 'Diesel',            unit: 'litre', kgCO2ePerUnit: 2.68, category: 'Mobile' },
  { id: 'lpg_veh_l',    label: 'LPG',               unit: 'litre', kgCO2ePerUnit: 1.56, category: 'Mobile' },
  { id: 'cng_kg',       label: 'CNG',               unit: 'kg',    kgCO2ePerUnit: 2.54, category: 'Mobile' },
]

export const VEHICLE_TYPES = [
  'Car (passenger)',
  'Van / Light commercial',
  'Truck / HGV',
  'Bus / Coach',
  'Motorcycle',
  'Other',
]

export const FUEL_FACTOR_VERSION = 'Defaults v1.0 (DEFRA/IPCC illustrative)'

export function findFuel(id: string): FuelFactor | undefined {
  return [...FUEL_FACTORS, ...VEHICLE_FUELS].find(f => f.id === id)
}

export function fuelEmissionsTons(fuelId: string, quantity: number): number {
  const f = findFuel(fuelId)
  if (!f || !Number.isFinite(quantity) || quantity <= 0) return 0
  return (f.kgCO2ePerUnit * quantity) / 1000
}

export function fleetConsumedQuantity(args: {
  mode: 'fuel' | 'distance'
  quantity: number
  kmDriven: number
  consumptionPer100km: number
}): number {
  if (args.mode === 'fuel') return Number(args.quantity) || 0
  const km = Number(args.kmDriven) || 0
  const rate = Number(args.consumptionPer100km) || 0
  if (!km || !rate) return 0
  return (km * rate) / 100
}

export function fleetEmissionsTons(
  fuelId: string,
  mode: 'fuel' | 'distance',
  quantity: number,
  kmDriven: number,
  consumptionPer100km: number,
): number {
  const f = findFuel(fuelId)
  if (!f) return 0
  const consumed = fleetConsumedQuantity({ mode, quantity, kmDriven, consumptionPer100km })
  if (!consumed) return 0
  return (f.kgCO2ePerUnit * consumed) / 1000
}
