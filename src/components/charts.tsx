import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'

export const CHART_COLORS = {
  scope1Fuels: '#1741c9',
  scope1Fleet: '#4f74d6',
  scope2:      '#83a4f0',
  renewable:   '#10b981',
  benchmark:   '#cbd5e1',
}

function fmt(n: number, digits = 1) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** Scope split donut (Scope 1 Fuels / Fleet / Scope 2) */
export function ScopeDonut({
  scope1Fuels, scope1Fleet, scope2,
}: { scope1Fuels: number; scope1Fleet: number; scope2: number }) {
  const total = scope1Fuels + scope1Fleet + scope2
  const data = [
    { name: 'Scope 1 – Fuels', value: scope1Fuels, color: CHART_COLORS.scope1Fuels },
    { name: 'Scope 1 – Fleet', value: scope1Fleet, color: CHART_COLORS.scope1Fleet },
    { name: 'Scope 2 – Electricity', value: scope2, color: CHART_COLORS.scope2 },
  ].filter(d => d.value > 0)

  if (total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-sm text-slate-400">
        <div>No emissions data yet</div>
        <div className="text-xs mt-1">Add Scope 1 / Scope 2 entries to see the breakdown.</div>
      </div>
    )
  }

  return (
    <div className="h-64 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={58}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="white"
            strokeWidth={2}
          >
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip
            formatter={(v: any) => `${fmt(Number(v), 2)} tCO₂e (${fmt((Number(v) / total) * 100, 1)}%)`}
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider">Total</div>
        <div className="text-xl font-semibold text-slate-900 tabular-nums">{fmt(total, 2)}</div>
        <div className="text-[11px] text-slate-500">tCO₂e</div>
      </div>
      {/* Legend */}
      <div className="mt-2 space-y-1">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }}></span>
              <span className="text-slate-700">{d.name}</span>
            </span>
            <span className="tabular-nums text-slate-600">
              {fmt(d.value, 2)} <span className="text-slate-400">({fmt((d.value / total) * 100, 0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Stacked bar of emissions by site */
export function PerSiteStackedBar({
  data,
}: {
  data: { site: string; scope1Fuels: number; scope1Fleet: number; scope2: number }[]
}) {
  const total = data.reduce(
    (s, d) => s + d.scope1Fuels + d.scope1Fleet + d.scope2, 0
  )
  if (total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-sm text-slate-400">
        <div>No site emissions yet</div>
      </div>
    )
  }
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="site" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <Tooltip
            formatter={(v: any, name: any) => [`${fmt(Number(v), 2)} tCO₂e`, String(name)]}
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="square" />
          <Bar dataKey="scope1Fuels" name="Scope 1 – Fuels" stackId="a" fill={CHART_COLORS.scope1Fuels} />
          <Bar dataKey="scope1Fleet" name="Scope 1 – Fleet" stackId="a" fill={CHART_COLORS.scope1Fleet} />
          <Bar dataKey="scope2"      name="Scope 2 – Electricity" stackId="a" fill={CHART_COLORS.scope2} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Sector benchmark — partner vs sector average (illustrative) */
export function SectorBenchmark({
  partner, sectorAvg, label,
}: { partner: number; sectorAvg: number; label: string }) {
  const data = [
    { name: 'Sector average', value: sectorAvg, fill: CHART_COLORS.benchmark },
    { name: label, value: partner, fill: CHART_COLORS.scope1Fuels },
  ]
  const delta = partner - sectorAvg
  const pct = sectorAvg > 0 ? (delta / sectorAvg) * 100 : 0
  return (
    <div className="space-y-3">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} width={80} />
            <Tooltip
              formatter={(v: any) => `${fmt(Number(v), 2)} tCO₂e`}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {partner > 0 && sectorAvg > 0 && (
        <div className={`text-sm px-3 py-2 rounded-md ${
          delta < 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          {delta < 0
            ? <>👏 Your emissions are <strong>{fmt(Math.abs(pct), 0)}% below</strong> the sector average — keep up the good work.</>
            : <>⚠️ Your emissions are <strong>{fmt(pct, 0)}% above</strong> the sector average. See the Reports module for reduction suggestions.</>}
        </div>
      )}
    </div>
  )
}
