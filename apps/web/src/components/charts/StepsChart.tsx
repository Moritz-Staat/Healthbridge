'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface StepsReading {
  measuredAt: string
  value: number
}

interface Props {
  data: StepsReading[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  const color = val >= 8000 ? 'text-green-600' : val >= 5000 ? 'text-yellow-600' : 'text-gray-500'
  const pct = Math.round((val / 8000) * 100)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className={`font-bold ${color}`}>{val.toLocaleString('de')} Schritte</p>
      <p className="text-xs text-gray-400 mt-1">{pct}% vom Tagesziel</p>
    </div>
  )
}

function getBarColor(value: number): string {
  if (value >= 8000) return '#16a34a'
  if (value >= 5000) return '#d97706'
  return '#9ca3af'
}

export function StepsChart({ data }: Props) {
  const chartData = data.map((d) => ({
    day: format(new Date(d.measuredAt), 'EEE', { locale: de }),
    fullDate: format(new Date(d.measuredAt), 'dd. MMM', { locale: de }),
    value: Math.round(Number(d.value)),
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          width={35}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={8000}
          stroke="#2563eb"
          strokeDasharray="5 3"
          strokeWidth={1.5}
          label={{ value: 'Ziel: 8k', position: 'right', fontSize: 10, fill: '#2563eb' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
