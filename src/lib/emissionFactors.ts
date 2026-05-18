// Emission factors catalog (FR-010). Values are illustrative and
// based on common public references (DEFRA / IPCC defaults). In the
// real Statamic build these will be admin-managed and versioned per
// reporting year.
//
// All factors return kgCO2e per unit. The calculation engine divides
// by 1000 at the end to convert to tCO2e.

export type FuelUnit = 'litre' | 'm3' | 'kg' | 'kWh'

export type FuelFactor = {
  id: string
  label: string        // shown in dropdown
  unit: FuelUnit
  kgCO2ePerUnit: number
  category: 'Stationary' | 'Mobile'
}

export const FUEL_FACTORS: FuelFactor[] = [
  // Stationary combustion (Scope 1 - Fuels)
  { id: 'natural_gas_m3',  label: 'Natural gas', unit: 'm3',    kgCO2ePerUnit: 2.02,  category: 'Stationary' },
  { id: 'natural_gas_kwh', label: 'Natural gas (metered kWh)', unit: 'kWh', kgCO2ePerUnit: 0.183, category: 'Stationary' },
  { id: 'diesel_l',        label: 'Diesel (heating / generator)', unit: 'litre', kgCO2ePerUnit: 2.68, category: 'Stationary' },
  { id: 'lpg_l',           label: 'LPG',         unit: 'litre', kgCO2ePerUnit: 1.56,  category: 'Stationary' },
  { id: 'lpg_kg',          label: 'LPG (by mass)', unit: 'kg',  kgCO2ePerUnit: 2.94,  category: 'Stationary' },
  { id: 'propane_l',       label: 'Propane',     unit: 'litre', kgCO2ePerUnit: 1.54,  category: 'Stationary' },
  { id: 'fuel_oil_l',      label: 'Fuel oil',    unit: 'litre', kgCO2ePerUnit: 3.19,  category: 'Stationary' },
  { id: 'kerosene_l',      label: 'Kerosene',    unit: 'litre', kgCO2ePerUnit: 2.54,  category: 'Stationary' },
]

export const VEHICLE_FUELS: FuelFactor[] = [
  // Mobile combustion (Scope 1 - Fleet) — per-litre factors,
  // multiplied by litres consumed (qty/km × consumption rate later).
  { id: 'petrol_l',     label: 'Petrol / Gasoline', unit: 'litre', kgCO2ePerUnit: 2.31, category: 'Mobile' },
  { id: 'diesel_veh_l', label: 'Diesel',            unit: 'litre', kgCO2ePerUnit: 2.68, category: 'Mobile' },
  { id: 'lpg_veh_l',    label: 'LPG',               unit: 'litre', kgCO2ePerUnit: 1.56, category: 'Mobile' },
  { id: 'cng_kg',       label: 'CNG (kg)',          unit: 'kg',    kgCO2ePerUnit: 2.54, category: 'Mobile' },
]

export const FUEL_FACTOR_VERSION = 'Defaults v1.0 (DEFRA/IPCC illustrative)'

export function findFuel(id: string): FuelFactor | undefined {
  return [...FUEL_FACTORS, ...VEHICLE_FUELS].find(f => f.id === id)
}

/** Emissions in tCO2e for a given fuel + quantity */
export function fuelEmissionsTons(fuelId: string, quantity: number): number {
  const f = findFuel(fuelId)
  if (!f || !Number.isFinite(quantity) || quantity <= 0) return 0
  return (f.kgCO2ePerUnit * quantity) / 1000
}
