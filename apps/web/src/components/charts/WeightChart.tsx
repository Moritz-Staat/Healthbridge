'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface WeightReading {
  measuredAt: string
  value: number
}

interface Props {
  data: WeightReading[]
}

interface ChartPoint {
  date: string
  weight: number
  trend: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value.toFixed(1)} kg
        </p>
      ))}
    </div>
  )
}

// Linear regression
function linearRegression(points: Array<{ x: number; y: number }>): (x: number) => number {
  const n = points.length
  if (n < 2) return () => points[0]?.y ?? 0
  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return (x: number) => slope * x + intercept
}

export function WeightChart({ data }: Props) {
  const sorted = [...data].sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
  )

  const regressionPoints = sorted.map((d, i) => ({ x: i, y: Number(d.value) }))
  const trendFn = linearRegression(regressionPoints)

  const chartData: ChartPoint[] = sorted.map((d, i) => ({
    date: format(new Date(d.measuredAt), 'dd.MM', { locale: de }),
    weight: Number(d.value),
    trend: Math.round(trendFn(i) * 10) / 10,
  }))

  const allValues = chartData.flatMap((d) => [d.weight, d.trend])
  const minY = Math.floor(Math.min(...allValues)) - 1
  const maxY = Math.ceil(Math.max(...allValues)) + 1

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minY, maxY]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          unit=" kg"
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line
          type="monotone"
          dataKey="weight"
          name="Gewicht"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 3, fill: '#2563eb' }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="trend"
          name="Trend"
          stroke="#dc2626"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
