'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface MedAdherence {
  name: string
  taken: number
  total: number
}

interface Props {
  data: MedAdherence[]
}

function getRateColor(rate: number): string {
  if (rate >= 0.85) return '#16a34a'
  if (rate >= 0.70) return '#d97706'
  return '#dc2626'
}

function DonutRing({ rate, size = 64 }: { rate: number; size?: number }) {
  const pct = Math.round(rate * 100)
  const color = getRateColor(rate)
  const pieData = [
    { value: pct },
    { value: 100 - pct },
  ]
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={pieData}
          cx={size / 2 - 1}
          cy={size / 2 - 1}
          innerRadius={size * 0.32}
          outerRadius={size * 0.47}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        >
          <Cell fill={color} />
          <Cell fill="#f3f4f6" />
        </Pie>
      </PieChart>
      <div
        className="absolute inset-0 flex items-center justify-center text-xs font-bold"
        style={{ color }}
      >
        {pct}%
      </div>
    </div>
  )
}

export function AdherenceChart({ data }: Props) {
  const overall = data.length > 0
    ? data.reduce((s, d) => s + d.taken, 0) / data.reduce((s, d) => s + d.total, 0)
    : 0

  return (
    <div className="space-y-4">
      {/* Overall */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <DonutRing rate={overall} size={72} />
        <div>
          <p className="font-semibold text-gray-800">Gesamt-Adhärenz</p>
          <p className="text-sm text-gray-500">Alle Medikamente</p>
          <p className="text-xs text-gray-400 mt-1">
            {data.reduce((s, d) => s + d.taken, 0)} / {data.reduce((s, d) => s + d.total, 0)} Einnahmen
          </p>
        </div>
      </div>

      {/* Per medication */}
      <div className="space-y-3">
        {data.map((med) => {
          const rate = med.total > 0 ? med.taken / med.total : 0
          const color = getRateColor(rate)
          const pct = Math.round(rate * 100)
          return (
            <div key={med.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium truncate">{med.name}</span>
                <span className="font-bold ml-2 flex-shrink-0" style={{ color }}>
                  {pct}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {med.taken} von {med.total} Einnahmen
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
