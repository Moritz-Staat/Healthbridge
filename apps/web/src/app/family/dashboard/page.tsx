import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, Badge } from '@/components/ui/Card'
import { AlertListener } from '@/components/ui/AlertListener'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { ALERT_TYPE_LABELS } from '@healthbridge/shared-types'
import Link from 'next/link'

function GlucoseBadge({ value }: { value: number }) {
  if (value > 180) return <Badge variant="danger">{value} mg/dl ↑</Badge>
  if (value < 70) return <Badge variant="danger">{value} mg/dl ↓</Badge>
  return <Badge variant="success">{value} mg/dl</Badge>
}

export default async function FamilyDashboard() {
  const session = await auth()
  const token = session!.user.accessToken

  const patients = await api.getFamilyPatients(token) as any[]

  const overviews = await Promise.all(
    patients.map(p => api.getFamilyPatientOverview(token, p.id).catch(() => null))
  )

  return (
    <div className="space-y-6">
      {/* AlertListener for all patients */}
      {patients.map(p => <AlertListener key={p.id} patientId={p.id} />)}

      <div>
        <h1 className="text-2xl font-bold">Familien-Übersicht</h1>
        <p className="text-gray-500 text-sm mt-1">
          {patients.length === 0
            ? 'Du bist noch mit keinem Patienten verknüpft.'
            : `Du betreust ${patients.length} Person${patients.length > 1 ? 'en' : ''}`}
        </p>
      </div>

      {patients.map((patient, i) => {
        const overview = overviews[i] as any
        if (!overview) return null

        const glucose = overview.latestMetrics?.find((m: any) => m.metricType === 'BLOOD_GLUCOSE')
        const steps = overview.latestMetrics?.find((m: any) => m.metricType === 'STEPS')
        const criticalAlerts = overview.alerts?.filter((a: any) => a.severity === 'CRITICAL' || a.severity === 'HIGH') ?? []

        return (
          <Card key={patient.id}>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{patient.fullName}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {format(new Date(patient.dateOfBirth), 'd. MMMM yyyy', { locale: de })} &middot;{' '}
                  {patient.insurance?.name ?? 'Keine Krankenkasse'}
                </p>
              </div>
              {criticalAlerts.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                  {criticalAlerts.length} kritische Warnung{criticalAlerts.length > 1 ? 'en' : ''}
                </span>
              )}
            </div>

            {/* Vital Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Blutzucker</p>
                {glucose
                  ? <GlucoseBadge value={Number(glucose.value)} />
                  : <span className="text-gray-400 text-sm">–</span>}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Schritte heute</p>
                <p className="font-bold text-sm">{steps ? Number(steps.value).toLocaleString('de') : '–'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Adherence (7 Tage)</p>
                <p className={`font-bold text-sm ${
                  overview.adherenceRate >= 80 ? 'text-green-600' :
                  overview.adherenceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {overview.adherenceRate != null ? `${overview.adherenceRate}%` : '–'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Bonuspunkte</p>
                <p className="font-bold text-sm">{overview.bonusTotal} Pkt.</p>
              </div>
            </div>

            {/* Medikamente heute */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Medikamente heute</h3>
              {overview.medications?.length === 0 ? (
                <p className="text-gray-400 text-sm">Keine aktiven Medikamente</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {overview.medications?.map((med: any) => {
                    const taken = med.logs.some((l: any) => l.confirmed)
                    const skipped = med.logs.some((l: any) => !l.confirmed)
                    return (
                      <div key={med.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                        taken ? 'bg-green-50 border-green-200 text-green-800' :
                        skipped ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                        'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        <span>{taken ? '✓' : skipped ? '–' : '✗'}</span>
                        <span className="font-medium">{med.name}</span>
                        {!taken && !skipped && <span className="text-xs opacity-75">nicht eingenommen</span>}
                        {skipped && !taken && <span className="text-xs opacity-75">übersprungen</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Alerts */}
            {overview.alerts?.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Offene Warnungen ({overview.alerts.length})
                </h3>
                <div className="space-y-2">
                  {overview.alerts.slice(0, 4).map((alert: any) => (
                    <div key={alert.id} className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                      alert.severity === 'CRITICAL' ? 'bg-red-50' :
                      alert.severity === 'HIGH' ? 'bg-orange-50' : 'bg-yellow-50'
                    }`}>
                      <Badge variant={
                        alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'danger' : 'warning'
                      }>
                        {alert.severity}
                      </Badge>
                      <span className="text-gray-700">{alert.message}</span>
                      <span className="text-gray-400 text-xs ml-auto shrink-0">
                        {format(new Date(alert.triggeredAt), 'd. MMM HH:mm', { locale: de })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nächste Termine */}
            {overview.appointments?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Nächste Termine</h3>
                <div className="space-y-1">
                  {overview.appointments.map((apt: any) => (
                    <div key={apt.id} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="text-blue-600 font-medium shrink-0">
                        {format(new Date(apt.appointmentDate), 'd. MMM', { locale: de })}
                      </span>
                      <span>{apt.title}</span>
                      {apt.doctorName && <span className="text-gray-400">· {apt.doctorName}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
