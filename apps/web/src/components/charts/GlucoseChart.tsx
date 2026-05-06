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
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface GlucoseReading {
  measuredAt: string
  value: number
}

interface Props {
  data: GlucoseReading[]
}

interface TooltipPayload {
  value: number
  name: string
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  const status = val > 180 ? 'text-red-600' : val < 70 ? 'text-yellow-600' : 'text-green-600'
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className={`font-bold ${status}`}>{val} mg/dl</p>
      <p className="text-xs text-gray-400 mt-1">
        {val > 180 ? 'Erhöht' : val < 70 ? 'Niedrig' : 'Im Zielbereich'}
      </p>
    </div>
  )
}

export function GlucoseChart({ data }: Props) {
  // Group and format for chart: average per day, keeping individual points
  const chartData = data.map((d) => ({
    date: format(new Date(d.measuredAt), 'dd.MM', { locale: de }),
    fullDate: format(new Date(d.measuredAt), 'dd. MMM, HH:mm', { locale: de }),
    value: Math.round(Number(d.value)),
    timestamp: new Date(d.measuredAt).getTime(),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#16a34a" stopOpacity={0.08} />
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
          domain={[50, 260]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          unit=" mg/dl"
          width={75}
        />
        <Tooltip content={<CustomTooltip />} />
        {/* Green "Time in Range" zone */}
        <ReferenceLine y={180} stroke="#dc2626" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: '180', position: 'right', fontSize: 10, fill: '#dc2626' }} />
        <ReferenceLine y={70} stroke="#d97706" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: '70', position: 'right', fontSize: 10, fill: '#d97706' }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#glucoseGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#2563eb' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
