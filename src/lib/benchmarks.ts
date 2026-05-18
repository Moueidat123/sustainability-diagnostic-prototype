import { benchmarkOverride } from './adminOverrides'
// Illustrative sector benchmarks (tCO2e per company per year).
// Will be admin-managed in the real product.
export const SECTOR_BENCHMARKS: Record<string, number> = {
  'Construction':            450,
  'Manufacturing':           650,
  'Energy & Utilities':      900,
  'Oil & Gas Services':      750,
  'Transportation & Logistics': 580,
  'Retail & Wholesale':      280,
  'Hospitality':             320,
  'Healthcare':              380,
  'Education':               210,
  'Information Technology':  120,
  'Professional Services':   95,
  'Agriculture':             410,
  'Other':                   300,
}

export function sectorBenchmark(sector: string): number {
  const ov = benchmarkOverride.get()[sector]
  if (Number.isFinite(ov)) return ov as number
  return SECTOR_BENCHMARKS[sector] ?? SECTOR_BENCHMARKS['Other']
}
