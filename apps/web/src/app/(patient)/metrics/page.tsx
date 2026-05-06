import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, StatCard } from '@/components/ui/Card'
import { HealthMetric, METRIC_LABELS, METRIC_UNITS } from '@healthbridge/shared-types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default async function MetricsPage() {
  const session = await auth()
  const token = session!.user.accessToken
  const patient = await api.getPatient(token) as any
  const [latest, all] = await Promise.all([
    api.getLatestMetrics(token, patient.id) as Promise<HealthMetric[]>,
    api.getMetrics(token, patient.id) as Promise<HealthMetric[]>,
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gesundheitsdaten</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {latest.map(m => (
          <StatCard
            key={m.id}
            label={METRIC_LABELS[m.metricType]}
            value={Number(m.value)}
            unit={METRIC_UNITS[m.metricType]}
            status={
              m.metricType === 'BLOOD_GLUCOSE' && (Number(m.value) > 180 || Number(m.value) < 70) ? 'danger' :
              m.metricType === 'HEART_RATE' && Number(m.value) > 150 ? 'warning' : 'normal'
            }
          />
        ))}
      </div>

      <Card title="Verlauf (letzte 100 Messungen)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Typ</th>
                <th className="pb-2 pr-4">Wert</th>
                <th className="pb-2 pr-4">Einheit</th>
                <th className="pb-2">Gemessen am</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {all.map(m => (
                <tr key={m.id}>
                  <td className="py-2 pr-4 font-medium">{METRIC_LABELS[m.metricType]}</td>
                  <td className="py-2 pr-4">{Number(m.value)}</td>
                  <td className="py-2 pr-4 text-gray-500">{m.unit}</td>
                  <td className="py-2 text-gray-500">
                    {format(new Date(m.measuredAt), "d. MMM yyyy, HH:mm", { locale: de })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
