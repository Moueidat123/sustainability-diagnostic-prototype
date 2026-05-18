// Accreditation model: categories, criteria, tiers and launch stages.
// All values are illustrative — in production they'd be admin-managed.

export type Tier = 'none' | 'essential' | 'advanced' | 'elite'

export const TIER_LABEL: Record<Tier, string> = {
  none: 'Not yet accredited',
  essential: 'Essential',
  advanced: 'Advanced',
  elite: 'Elite',
}

export const TIER_COLOR: Record<Tier, { bg: string; text: string; ring: string; dot: string }> = {
  none:      { bg: 'bg-slate-100',   text: 'text-slate-700',   ring: 'ring-slate-200',  dot: 'bg-slate-400' },
  essential: { bg: 'bg-sky-50',      text: 'text-sky-800',     ring: 'ring-sky-200',    dot: 'bg-sky-500' },
  advanced:  { bg: 'bg-indigo-50',   text: 'text-indigo-800',  ring: 'ring-indigo-200', dot: 'bg-indigo-500' },
  elite:     { bg: 'bg-amber-50',    text: 'text-amber-800',   ring: 'ring-amber-200',  dot: 'bg-amber-500' },
}

export type CategoryId =
  | 'governance'
  | 'carbon'
  | 'energy'
  | 'social'
  | 'reporting'

export type Criterion = {
  id: string
  label: string
  hint?: string
  weight: number          // points contributed if met
  tier: Exclude<Tier, 'none'>  // minimum tier this criterion is associated with
}

export type Category = {
  id: CategoryId
  label: string
  description: string
  criteria: Criterion[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'governance',
    label: 'Governance & Strategy',
    description: 'Leadership commitment and sustainability strategy.',
    criteria: [
      { id: 'gov.policy',   label: 'Documented sustainability policy',            weight: 10, tier: 'essential', hint: 'Signed by senior management.' },
      { id: 'gov.owner',    label: 'Sustainability lead / committee assigned',    weight: 8,  tier: 'essential' },
      { id: 'gov.strategy', label: '3-year sustainability strategy with targets', weight: 12, tier: 'advanced' },
      { id: 'gov.board',    label: 'Board-level oversight of ESG performance',    weight: 10, tier: 'elite' },
    ],
  },
  {
    id: 'carbon',
    label: 'Carbon Management',
    description: 'GHG measurement, reduction and reporting.',
    criteria: [
      { id: 'carbon.scope12', label: 'Scope 1 & 2 inventory completed',              weight: 12, tier: 'essential', hint: 'Covered by the diagnostic.' },
      { id: 'carbon.target',  label: 'Public emissions reduction target',            weight: 10, tier: 'advanced' },
      { id: 'carbon.scope3',  label: 'Scope 3 screening for material categories',    weight: 8,  tier: 'advanced' },
      { id: 'carbon.netzero', label: 'Validated net-zero pathway (e.g. SBTi)',       weight: 14, tier: 'elite' },
    ],
  },
  {
    id: 'energy',
    label: 'Energy & Resources',
    description: 'Efficiency, renewables and resource use.',
    criteria: [
      { id: 'energy.meter',     label: 'Sub-metering across major sites',          weight: 6,  tier: 'essential' },
      { id: 'energy.audit',     label: 'Energy audit completed in last 3 years',   weight: 8,  tier: 'advanced' },
      { id: 'energy.renew10',   label: '≥10% renewable electricity',               weight: 8,  tier: 'advanced' },
      { id: 'energy.renew50',   label: '≥50% renewable electricity',               weight: 12, tier: 'elite' },
      { id: 'energy.water',     label: 'Water & waste reduction plan in place',    weight: 6,  tier: 'advanced' },
    ],
  },
  {
    id: 'social',
    label: 'Social & Workforce',
    description: 'Health, safety, diversity and community impact.',
    criteria: [
      { id: 'social.hse',     label: 'HSE policy with incident tracking',           weight: 8,  tier: 'essential' },
      { id: 'social.train',   label: 'Annual sustainability training for staff',    weight: 6,  tier: 'advanced' },
      { id: 'social.diversity', label: 'Diversity & inclusion targets',             weight: 8,  tier: 'elite' },
    ],
  },
  {
    id: 'reporting',
    label: 'Disclosure & Reporting',
    description: 'Transparency to stakeholders.',
    criteria: [
      { id: 'rep.internal', label: 'Internal annual sustainability report',         weight: 6,  tier: 'essential' },
      { id: 'rep.public',   label: 'Publicly available sustainability report',      weight: 10, tier: 'advanced' },
      { id: 'rep.assured',  label: 'Externally assured ESG disclosure',             weight: 12, tier: 'elite' },
    ],
  },
]

// Tier thresholds expressed as % of total weighted points
export const TIER_THRESHOLDS: { tier: Exclude<Tier, 'none'>; min: number }[] = [
  { tier: 'essential', min: 35 },
  { tier: 'advanced',  min: 60 },
  { tier: 'elite',     min: 85 },
]

export function totalPoints(): number {
  return CATEGORIES.reduce((s, c) => s + c.criteria.reduce((a, k) => a + k.weight, 0), 0)
}

export function scoreFor(answers: Record<string, boolean>) {
  let earned = 0
  const perCategory: Record<CategoryId, { earned: number; possible: number }> = {
    governance: { earned: 0, possible: 0 },
    carbon:     { earned: 0, possible: 0 },
    energy:     { earned: 0, possible: 0 },
    social:     { earned: 0, possible: 0 },
    reporting:  { earned: 0, possible: 0 },
  }
  CATEGORIES.forEach(cat => {
    cat.criteria.forEach(cr => {
      perCategory[cat.id].possible += cr.weight
      if (answers[cr.id]) {
        earned += cr.weight
        perCategory[cat.id].earned += cr.weight
      }
    })
  })
  const possible = totalPoints()
  const pct = possible ? (earned / possible) * 100 : 0
  return { earned, possible, pct, perCategory }
}

export function suggestedTier(pct: number): Tier {
  let t: Tier = 'none'
  for (const th of TIER_THRESHOLDS) if (pct >= th.min) t = th.tier
  return t
}

// ---------- Launch stages ----------

export type StageId = 'eligibility' | 'diagnostic' | 'review' | 'accredited' | 'published'

export const STAGES: { id: StageId; label: string; description: string }[] = [
  { id: 'eligibility', label: 'Eligibility',          description: 'Company profile complete & at least one site.' },
  { id: 'diagnostic',  label: 'Diagnostic submitted', description: 'All Scope 1 & 2 modules contain data and submission sent.' },
  { id: 'review',      label: 'Reviewed',             description: 'Reviewer & Program Manager have approved the diagnostic.' },
  { id: 'accredited',  label: 'Accredited',           description: 'Tier assigned by Program Manager based on the checklist.' },
  { id: 'published',   label: 'Published',            description: 'Accreditation badge visible on partner directory.' },
]

// ---------- Persisted state ----------

export type AccreditationState = {
  answers: Record<string, boolean>
  assignedTier: Tier        // 'none' until Program Manager assigns
  published: boolean
  assignedAt?: number
  assignedBy?: string       // role label
  publishedAt?: number
  pmNote?: string
}

export const EMPTY_ACCREDITATION: AccreditationState = {
  answers: {},
  assignedTier: 'none',
  published: false,
}
