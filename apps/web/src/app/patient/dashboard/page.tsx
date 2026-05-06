import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { StatCard, Card } from '@/components/ui/Card'
import { AlertListener } from '@/components/ui/AlertListener'
import { Badge } from '@/components/ui/Card'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Alert, HealthMetric, Medication, METRIC_LABELS, METRIC_UNITS } from '@healthbridge/shared-types'

export default async function PatientDashboard() {
  const session = await auth()
  const token = session!.user.accessToken

  const patient = await api.getPatient(token) as any
  const [latestMetrics, medications, alertsData, bonusData, appointments] = await Promise.all([
    api.getLatestMetrics(token, patient.id) as Promise<HealthMetric[]>,
    api.getMedications(token, patient.id) as Promise<Medication[]>,
    api.getAlerts(token, patient.id, false) as Promise<Alert[]>,
    api.getBonus(token, patient.id) as Promise<{ total: number }>,
    api.getAppointments(token, patient.id) as Promise<any[]>,
  ])

  const glucose = latestMetrics.find(m => m.metricType === 'BLOOD_GLUCOSE')
  const heartRate = latestMetrics.find(m => m.metricType === 'HEART_RATE')
  const steps = latestMetrics.find(m => m.metricType === 'STEPS')

  const nextAppointment = appointments.find(a => !a.completed && new Date(a.appointmentDate) > new Date())

  return (
    <div className="space-y-6">
      <AlertListener patientId={patient.id} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hallo, {patient.fullName}</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}</p>
      </div>

      {/* Vital Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Blutzucker"
          value={glucose ? Number(glucose.value) : '–'}
          unit="mg/dl"
          status={glucose && Number(glucose.value) > 180 ? 'danger' : glucose && Number(glucose.value) < 70 ? 'danger' : 'normal'}
        />
        <StatCard
          label="Herzfrequenz"
          value={heartRate ? Number(heartRate.value) : '–'}
          unit="bpm"
          status={heartRate && Number(heartRate.value) > 150 ? 'warning' : 'normal'}
        />
        <StatCard
          label="Schritte heute"
          value={steps ? Number(steps.value).toLocaleString('de') : '–'}
          status={steps && Number(steps.value) >= 8000 ? 'normal' : 'warning'}
        />
        <StatCard
          label="Bonuspunkte"
          value={bonusData.total}
          unit="Pkt."
          status="normal"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Medications */}
        <Card title="Heutige Medikamente">
          {medications.length === 0 ? (
            <p className="text-gray-400 text-sm">Keine Medikamente eingetragen</p>
          ) : (
            <ul className="space-y-3">
              {medications.slice(0, 5).map((med: any) => {
                const takenToday = med.logs?.some((l: any) => {
                  const today = new Date(); const taken = new Date(l.takenAt)
                  return taken.toDateString() === today.toDateString()
                })
                return (
                  <li key={med.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{med.name}</p>
                      <p className="text-xs text-gray-500">{med.dosage}</p>
                    </div>
                    <Badge variant={takenToday ? 'success' : 'warning'}>
                      {takenToday ? 'Eingenommen' : 'Ausstehend'}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Alerts */}
        <Card title={`Warnungen ${alertsData.length > 0 ? `(${alertsData.length})` : ''}`}>
          {alertsData.length === 0 ? (
            <p className="text-gray-400 text-sm">Keine offenen Warnungen</p>
          ) : (
            <ul className="space-y-2">
              {alertsData.slice(0, 5).map((alert: Alert) => (
                <li key={alert.id} className="flex items-start gap-2">
                  <Badge variant={alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'danger' : 'warning'}>
                    {alert.severity}
                  </Badge>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Next Appointment */}
        {nextAppointment && (
          <Card title="Nächster Termin">
            <p className="font-medium">{nextAppointment.title}</p>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(nextAppointment.appointmentDate), "d. MMMM yyyy, HH:mm", { locale: de })} Uhr
            </p>
            {nextAppointment.doctorName && <p className="text-sm text-gray-500">{nextAppointment.doctorName}</p>}
            {nextAppointment.location && <p className="text-sm text-gray-500">{nextAppointment.location}</p>}
          </Card>
        )}
      </div>
    </div>
  )
}
