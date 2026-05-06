'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface HeartRateReading {
  measuredAt: string
  value: number
}

interface Props {
  data: HeartRateReading[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  const status = val > 100 ? 'text-red-600' : val < 60 ? 'text-blue-600' : 'text-green-600'
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className={`font-bold ${status}`}>{val} bpm</p>
    </div>
  )
}

export function HeartRateChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: format(new Date(d.measuredAt), 'dd.MM', { locale: de }),
    value: Math.round(Number(d.value)),
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          interval="preserveStartEnd"
          tickLine={false}
        />
        <YAxis
          domain={[45, 120]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          unit=" bpm"
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={100} stroke="#dc2626" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: '100', position: 'right', fontSize: 10, fill: '#dc2626' }} />
        <ReferenceLine y={60} stroke="#2563eb" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: '60', position: 'right', fontSize: 10, fill: '#2563eb' }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#dc2626"
          strokeWidth={2}
          fill="url(#hrGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#dc2626' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
