import { fuelOverride, gridOverride } from './adminOverrides'

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
  const base = [...FUEL_FACTORS, ...VEHICLE_FUELS].find(f => f.id === id)
  if (!base) return undefined
  const ov = fuelOverride.get()[id]
  return Number.isFinite(ov) ? { ...base, kgCO2ePerUnit: ov as number } : base
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

// ============================================================
// Scope 2 — Electricity grid factors
// kgCO2e per kWh of grid electricity, by country (illustrative).
// In the real product these are admin-managed per reporting year.
// ============================================================

export const GRID_FACTORS: Record<string, number> = {
  'Saudi Arabia':         0.732,
  'United Arab Emirates': 0.490,
  'Bahrain':              0.747,
  'Kuwait':               0.617,
  'Oman':                 0.532,
  'Qatar':                0.490,
  'Egypt':                0.460,
  'Jordan':               0.482,
  'Lebanon':              0.642,
  'United Kingdom':       0.207,
  'United States':        0.371,
  'Other':                0.500,
}

export const GRID_FACTOR_VERSION = 'IFI / IEA 2023 averages (illustrative)'

/** Grid factor (kgCO2e per kWh) for a country, with a safe fallback. */
export function gridFactor(country: string): number {
  const ov = gridOverride.get()[country]
  if (Number.isFinite(ov)) return ov as number
  return GRID_FACTORS[country] ?? GRID_FACTORS['Other']
}

/** Scope 2 electricity emissions in tCO2e.
 *  Convention: grid kWh uses country grid factor; renewable kWh = 0.
 */
export function electricityEmissionsTons(country: string, gridKwh: number): number {
  if (!Number.isFinite(gridKwh) || gridKwh <= 0) return 0
  return (gridFactor(country) * gridKwh) / 1000
}
