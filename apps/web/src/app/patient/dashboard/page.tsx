import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, StatCard, Badge } from '@/components/ui/Card'
import { AlertListener } from '@/components/ui/AlertListener'
import { GlucoseChart } from '@/components/charts/GlucoseChart'
import { GlucoseStats } from '@/components/charts/GlucoseStats'
import { StepsChart } from '@/components/charts/StepsChart'
import { AdherenceChart } from '@/components/charts/AdherenceChart'
import { SleepChart } from '@/components/charts/SleepChart'
import { HeartRateChart } from '@/components/charts/HeartRateChart'
import { WeightChart } from '@/components/charts/WeightChart'
import { format, subDays, startOfDay } from 'date-fns'
import { de } from 'date-fns/locale'

function getTrendArrow(values: number[]): string {
  if (values.length < 3) return '→'
  const recent = values.slice(-3).reduce((s, v) => s + v, 0) / 3
  const earlier = values.slice(-6, -3).reduce((s, v) => s + v, 0) / 3
  if (recent > earlier + 5) return '↑'
  if (recent < earlier - 5) return '↓'
  return '→'
}

function calcHbA1c(avgGlucose: number): string {
  return ((avgGlucose + 46.7) / 28.7).toFixed(1)
}

export default async function PatientDashboard() {
  const session = await auth()
  const token = session!.user.accessToken

  const patient = await api.getPatient(token) as any
  const patientId = patient.id
  const now = new Date()
  const day30 = subDays(now, 30)
  const day14 = subDays(now, 14)
  const day90 = subDays(now, 90)

  const [latestMetrics, medications, alertsData, bonusData, appointments, allMetrics] = await Promise.all([
    api.getLatestMetrics(token, patientId) as Promise<any[]>,
    api.getMedications(token, patientId) as Promise<any[]>,
    api.getAlerts(token, patientId, false) as Promise<any[]>,
    api.getBonus(token, patientId) as Promise<{ total: number }>,
    api.getAppointments(token, patientId) as Promise<any[]>,
    api.getMetrics(token, patientId, { limit: '1000' }) as Promise<any[]>,
  ])

  // Filter metrics by type and date ranges
  const glucose30 = allMetrics
    .filter((m: any) => m.metricType === 'BLOOD_GLUCOSE' && new Date(m.measuredAt) >= day30)
    .sort((a: any, b: any) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())

  const steps14 = allMetrics
    .filter((m: any) => m.metricType === 'STEPS' && new Date(m.measuredAt) >= day14)
    .sort((a: any, b: any) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())

  const sleep14 = allMetrics
    .filter((m: any) => m.metricType === 'SLEEP_HOURS' && new Date(m.measuredAt) >= day14)
    .sort((a: any, b: any) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())

  const hr30 = allMetrics
    .filter((m: any) => m.metricType === 'HEART_RATE' && new Date(m.measuredAt) >= day30)
    .sort((a: any, b: any) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())

  const weight90 = allMetrics
    .filter((m: any) => m.metricType === 'BODY_WEIGHT' && new Date(m.measuredAt) >= day90)
    .sort((a: any, b: any) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())

  // Stats
  const glucoseValues = glucose30.map((m: any) => Number(m.value))
  const avgGlucose = glucoseValues.length > 0
    ? Math.round(glucoseValues.reduce((s: number, v: number) => s + v, 0) / glucoseValues.length)
    : 0
  const hba1c = avgGlucose > 0 ? calcHbA1c(avgGlucose) : '–'
  const hba1cNum = parseFloat(hba1c)
  const hba1cStatus = hba1cNum < 6.5 ? 'gut' : hba1cNum < 7.5 ? 'ok' : 'erhöht'
  const hba1cColor = hba1cNum < 6.5 ? 'normal' : hba1cNum < 7.5 ? 'warning' : ('danger' as any)

  const currentGlucose = latestMetrics.find((m: any) => m.metricType === 'BLOOD_GLUCOSE')
  const currentSteps = latestMetrics.find((m: any) => m.metricType === 'STEPS')

  const glucoseTrend = getTrendArrow(glucoseValues)
  const stepsGoalPct = currentSteps
    ? Math.min(Math.round((Number(currentSteps.value) / 8000) * 100), 999)
    : 0

  // Upcoming appointments
  const upcoming = appointments
    .filter((a: any) => !a.completed && new Date(a.appointmentDate) > now)
    .sort((a: any, b: any) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
    .slice(0, 3)

  // Medication adherence
  const medsWithLogs = await Promise.all(
    medications.map(async (med: any) => {
      const medMetrics = await api.getMetrics(token, patientId, { limit: '1' }) as any[]
      return med
    })
  )

  // Calculate adherence from allMetrics — we use a simple approach with all meds
  // We'll derive adherence from medication logs via medications endpoint which includes logs
  const adherenceData = medications.map((med: any) => {
    const logs = med.logs ?? []
    const total = logs.length
    const taken = logs.filter((l: any) => l.confirmed).length
    return { name: med.name, taken, total }
  })

  // Sort alerts by severity
  const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const sortedAlerts = [...alertsData].sort(
    (a: any, b: any) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
  )

  return (
    <div className="space-y-6">
      <AlertListener patientId={patient.id} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hallo, {patient.fullName} {glucoseTrend !== '→' ? glucoseTrend : ''}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          {alertsData.length > 0 && (
            <span className="ml-3 text-red-500 font-medium">
              {alertsData.length} offene {alertsData.length === 1 ? 'Warnung' : 'Warnungen'}
            </span>
          )}
        </p>
      </div>

      {/* Row 1 — Vital Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Blutzucker (aktuell)"
          value={currentGlucose ? `${Number(currentGlucose.value)} ${glucoseTrend}` : '–'}
          unit="mg/dl"
          status={
            currentGlucose && Number(currentGlucose.value) > 180 ? 'danger' :
            currentGlucose && Number(currentGlucose.value) < 70 ? 'danger' : 'normal'
          }
        />
        <StatCard
          label="HbA1c (Schätzung)"
          value={hba1c === '–' ? '–' : `${hba1c}%`}
          unit={hba1cStatus}
          status={hba1cColor}
        />
        <StatCard
          label="Schritte heute"
          value={currentSteps ? Number(currentSteps.value).toLocaleString('de') : '–'}
          unit={`${stepsGoalPct}% Ziel`}
          status={stepsGoalPct >= 100 ? 'normal' : stepsGoalPct >= 60 ? 'warning' : 'danger'}
        />
        <StatCard
          label="Bonuspunkte"
          value={bonusData.total}
          unit="Pkt."
          status="normal"
        />
      </div>

      {/* Row 2 — Glucose Chart + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Blutzucker-Verlauf (30 Tage)" className="lg:col-span-2">
          {glucose30.length > 0 ? (
            <GlucoseChart data={glucose30.map((m: any) => ({ measuredAt: m.measuredAt, value: Number(m.value) }))} />
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">Keine Daten</p>
          )}
        </Card>
        <Card title="Glukose-Statistik">
          <GlucoseStats readings={glucoseValues} />
        </Card>
      </div>

      {/* Row 3 — Steps + Adherence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Schritte (letzte 14 Tage)">
          {steps14.length > 0 ? (
            <StepsChart data={steps14.map((m: any) => ({ measuredAt: m.measuredAt, value: Number(m.value) }))} />
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">Keine Daten</p>
          )}
        </Card>
        <Card title="Medikamenten-Einnahme">
          {adherenceData.some((d) => d.total > 0) ? (
            <AdherenceChart data={adherenceData} />
          ) : (
            <div className="space-y-3">
              {medications.map((med: any) => (
                <div key={med.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{med.name}</p>
                    <p className="text-xs text-gray-500">{med.dosage}</p>
                  </div>
                  <Badge variant="success">Aktiv</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Row 4 — Sleep + HR + Weight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Schlafqualität (14 Tage)">
          {sleep14.length > 0 ? (
            <SleepChart data={sleep14.map((m: any) => ({ measuredAt: m.measuredAt, value: Number(m.value) }))} />
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">Keine Daten</p>
          )}
        </Card>
        <Card title="Herzfrequenz (30 Tage)">
          {hr30.length > 0 ? (
            <HeartRateChart data={hr30.map((m: any) => ({ measuredAt: m.measuredAt, value: Number(m.value) }))} />
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">Keine Daten</p>
          )}
        </Card>
        <Card title="Gewichtsverlauf (90 Tage)">
          {weight90.length > 0 ? (
            <WeightChart data={weight90.map((m: any) => ({ measuredAt: m.measuredAt, value: Number(m.value) }))} />
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">Keine Daten</p>
          )}
        </Card>
      </div>

      {/* Row 5 — Appointments + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Nächste Termine">
          {upcoming.length === 0 ? (
            <p className="text-gray-400 text-sm">Keine bevorstehenden Termine</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((apt: any) => (
                <li key={apt.id} className="flex gap-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 text-center">
                    <p className="text-xs text-blue-500 font-medium">
                      {format(new Date(apt.appointmentDate), 'MMM', { locale: de }).toUpperCase()}
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {format(new Date(apt.appointmentDate), 'd')}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{apt.title}</p>
                    {apt.doctorName && <p className="text-xs text-gray-500 mt-0.5">{apt.doctorName}</p>}
                    {apt.location && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{apt.location}</p>
                    )}
                    <p className="text-xs text-blue-600 mt-1">
                      {format(new Date(apt.appointmentDate), 'HH:mm', { locale: de })} Uhr
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Offene Warnungen ${alertsData.length > 0 ? `(${alertsData.length})` : ''}`}>
          {alertsData.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <p className="text-3xl mb-2">✓</p>
              <p className="text-green-600 font-medium text-sm">Keine offenen Warnungen</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sortedAlerts.slice(0, 6).map((alert: any) => (
                <li key={alert.id} className="flex items-start gap-2 py-1">
                  <Badge variant={
                    alert.severity === 'CRITICAL' ? 'danger' :
                    alert.severity === 'HIGH' ? 'danger' :
                    alert.severity === 'MEDIUM' ? 'warning' : 'default'
                  }>
                    {alert.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-tight">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(alert.triggeredAt), 'd. MMM, HH:mm', { locale: de })}
                    </p>
                  </div>
                </li>
              ))}
              {alertsData.length > 6 && (
                <li className="text-xs text-gray-400 pt-1">
                  + {alertsData.length - 6} weitere Warnungen
                </li>
              )}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
