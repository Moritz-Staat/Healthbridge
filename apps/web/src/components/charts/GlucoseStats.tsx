'use client'

interface Props {
  readings: number[]
}

function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function GlucoseStats({ readings }: Props) {
  if (readings.length === 0) {
    return <p className="text-gray-400 text-sm">Keine Daten</p>
  }

  const inRange = readings.filter((v) => v >= 70 && v <= 180)
  const timeInRange = Math.round((inRange.length / readings.length) * 100)

  const avg = readings.reduce((s, v) => s + v, 0) / readings.length
  const avgRounded = Math.round(avg)

  // HbA1c estimate: (avg + 46.7) / 28.7
  const hba1c = ((avg + 46.7) / 28.7).toFixed(1)
  const hba1cNum = parseFloat(hba1c)
  const hba1cStatus = hba1cNum < 6.5 ? 'gut' : hba1cNum < 7.5 ? 'ok' : 'erhöht'
  const hba1cColor = hba1cNum < 6.5 ? 'text-green-600' : hba1cNum < 7.5 ? 'text-yellow-600' : 'text-red-600'

  // CV (coefficient of variation)
  const sd = stdDev(readings, avg)
  const cv = Math.round((sd / avg) * 100)

  const tirColor = timeInRange >= 70 ? 'text-green-600' : timeInRange >= 50 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Time in Range */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Time in Range</p>
          <p className={`text-2xl font-bold mt-1 ${tirColor}`}>{timeInRange}%</p>
          <p className="text-xs text-gray-400 mt-1">Ziel: ≥70%</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${Math.min(timeInRange, 100)}%`,
                backgroundColor: timeInRange >= 70 ? '#16a34a' : timeInRange >= 50 ? '#d97706' : '#dc2626',
              }}
            />
          </div>
        </div>

        {/* Average */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Durchschnitt</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">{avgRounded}</p>
          <p className="text-xs text-gray-400 mt-1">mg/dl</p>
        </div>

        {/* HbA1c */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">HbA1c (Schätzung)</p>
          <p className={`text-2xl font-bold mt-1 ${hba1cColor}`}>{hba1c}%</p>
          <p className={`text-xs mt-1 font-medium ${hba1cColor}`}>{hba1cStatus}</p>
        </div>

        {/* CV */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Variabilität (CV)</p>
          <p className={`text-2xl font-bold mt-1 ${cv <= 36 ? 'text-green-600' : 'text-yellow-600'}`}>{cv}%</p>
          <p className="text-xs text-gray-400 mt-1">Ziel: ≤36%</p>
        </div>
      </div>

      {/* Range breakdown */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Verteilung</p>
        {[
          { label: 'Sehr hoch (>250)', count: readings.filter((v) => v > 250).length, color: '#7f1d1d' },
          { label: 'Hoch (180–250)', count: readings.filter((v) => v > 180 && v <= 250).length, color: '#dc2626' },
          { label: 'Zielbereich (70–180)', count: inRange.length, color: '#16a34a' },
          { label: 'Niedrig (54–70)', count: readings.filter((v) => v >= 54 && v < 70).length, color: '#d97706' },
          { label: 'Sehr niedrig (<54)', count: readings.filter((v) => v < 54).length, color: '#92400e' },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: row.color }} />
            <span className="text-gray-600 flex-1">{row.label}</span>
            <span className="font-medium text-gray-800">
              {Math.round((row.count / readings.length) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
