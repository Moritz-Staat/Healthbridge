import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, StatCard } from '@/components/ui/Card'
import { GlucoseChart } from '@/components/charts/GlucoseChart'
import { GlucoseStats } from '@/components/charts/GlucoseStats'
import { StepsChart } from '@/components/charts/StepsChart'
import { HeartRateChart } from '@/components/charts/HeartRateChart'
import { WeightChart } from '@/components/charts/WeightChart'
import { SleepChart } from '@/components/charts/SleepChart'
import { format, subDays } from 'date-fns'
import { de } from 'date-fns/locale'

export default async function MetricsPage() {
  const session = await auth()
  const token = session!.user.accessToken
  const patient = await api.getPatient(token) as any
  const patientId = patient.id

  const now = new Date()
  const day30 = subDays(now, 30)
  const day14 = subDays(now, 14)
  const day90 = subDays(now, 90)

  const allMetrics = await api.getMetrics(token, patientId, { limit: '1000' }) as any[]

  const glucose30 = allMetrics
    .filter((m: any) => m.metricType === 'BLOOD_GLUCOSE' && new Date(m.measuredAt) >= day30)
    .sort((a: any, b: any) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())

  const steps14 = allMetrics
    .filter((m: any) => m.metricType === 'STEPS' && new Date(m.measuredAt) >= day14)
    .sort((a: any, b: any) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())

  const hr30 = allMetrics
    .filter((m: any) => m.metricType === 'HEART_RATE' && new Date(m.measuredAt) >= day30)
    .sort((a: any, b: any) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())

  const weight90 = allMetrics
    .filter((m: any) => m.metricType === 'BODY_WEIGHT' && new Date(m.measuredAt) >= day90)
    .sort((a: any, b: any) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())

  const sleep14 = allMetrics
    .filter((m: any) => m.metricType === 'SLEEP_HOURS' && new Date(m.measuredAt) >= day14)
    .sort((a: any, b: any) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())

  // Glucose stats
  const glucoseValues = glucose30.map((m: any) => Number(m.value))
  const avgGlucose = glucoseValues.length > 0
    ? Math.round(glucoseValues.reduce((s: number, v: number) => s + v, 0) / glucoseValues.length)
    : 0

  // Steps stats
  const stepsValues = steps14.map((m: any) => Number(m.value))
  const avgSteps = stepsValues.length > 0
    ? Math.round(stepsValues.reduce((s: number, v: number) => s + v, 0) / stepsValues.length)
    : 0
  const totalSteps14 = stepsValues.reduce((s: number, v: number) => s + v, 0)

  // HR stats
  const hrValues = hr30.map((m: any) => Number(m.value))
  const avgHr = hrValues.length > 0
    ? Math.round(hrValues.reduce((s: number, v: number) => s + v, 0) / hrValues.length)
    : 0
  const minHr = hrValues.length > 0 ? Math.min(...hrValues) : 0
  const maxHr = hrValues.length > 0 ? Math.max(...hrValues) : 0

  // Weight stats
  const weightValues = weight90.map((m: any) => Number(m.value))
  const latestWeight = weightValues[weightValues.length - 1] ?? 0
  const firstWeight = weightValues[0] ?? 0
  const weightChange = weightValues.length >= 2
    ? Math.round((latestWeight - firstWeight) * 10) / 10
    : 0
  const height = 178 // cm assumed
  const bmi = latestWeight > 0 ? Math.round((latestWeight / ((height / 100) ** 2)) * 10) / 10 : 0
  const bmiCategory = bmi < 18.5 ? 'Untergewicht' : bmi < 25 ? 'Normalgewicht' : bmi < 30 ? 'Übergewicht' : 'Adipositas'

  // Sleep stats
  const sleepValues = sleep14.map((m: any) => Number(m.value))
  const avgSleep = sleepValues.length > 0
    ? Math.round((sleepValues.reduce((s: number, v: number) => s + v, 0) / sleepValues.length) * 10) / 10
    : 0
  const nightsUnder6 = sleepValues.filter((v) => v < 6).length

  // Latest 20 glucose readings
  const latestGlucose20 = allMetrics
    .filter((m: any) => m.metricType === 'BLOOD_GLUCOSE')
    .sort((a: any, b: any) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())
    .slice(0, 20)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Gesundheitsdaten</h1>

      {/* ── Blutzucker ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">Blutzucker</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Verlauf (30 Tage)" className="lg:col-span-2">
            {glucose30.length > 0 ? (
              <GlucoseChart data={glucose30.map((m: any) => ({ measuredAt: m.measuredAt, value: Number(m.value) }))} />
            ) : (
              <p className="text-gray-400 text-sm py-8 text-center">Keine Daten</p>
            )}
          </Card>
          <Card title="Statistik">
            <GlucoseStats readings={glucoseValues} />
          </Card>
        </div>
        <Card title="Letzte 20 Messungen">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b text-xs uppercase tracking-wide">
                  <th className="pb-2 pr-4">Datum & Uhrzeit</th>
                  <th className="pb-2 pr-4">Wert</th>
                  <th className="pb-2">Bewertung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {latestGlucose20.map((m: any) => {
                  const val = Number(m.value)
                  const status = val > 180 ? { label: 'Erhöht', cls: 'text-red-600 bg-red-50' } :
                                 val < 70 ? { label: 'Niedrig', cls: 'text-yellow-700 bg-yellow-50' } :
                                 { label: 'Gut', cls: 'text-green-700 bg-green-50' }
                  return (
                    <tr key={m.id}>
                      <td className="py-2 pr-4 text-gray-600">
                        {format(new Date(m.measuredAt), "d. MMM yyyy, HH:mm", { locale: de })}
                      </td>
                      <td className="py-2 pr-4 font-bold text-gray-900">{val} mg/dl</td>
                      <td className="py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ── Aktivität ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">Aktivität</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Ø Schritte (14 Tage)"
            value={avgSteps.toLocaleString('de')}
            unit="Schritte/Tag"
            status={avgSteps >= 8000 ? 'normal' : avgSteps >= 5000 ? 'warning' : 'danger'}
          />
          <StatCard
            label="Gesamt (14 Tage)"
            value={(totalSteps14 / 1000).toFixed(0) + 'k'}
            unit="Schritte"
            status="normal"
          />
          <StatCard
            label="Tagesziel erreicht"
            value={stepsValues.filter((v) => v >= 8000).length}
            unit={`von ${stepsValues.length} Tagen`}
            status={stepsValues.filter((v) => v >= 8000).length >= 10 ? 'normal' : 'warning'}
          />
        </div>
        <Card title="Schritte (letzte 14 Tage)">
          {steps14.length > 0 ? (
            <StepsChart data={steps14.map((m: any) => ({ measuredAt: m.measuredAt, value: Number(m.value) }))} />
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">Keine Daten</p>
          )}
        </Card>
      </section>

      {/* ── Herzfrequenz ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">Herzfrequenz</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Min (30 Tage)" value={minHr} unit="bpm" status="normal" />
          <StatCard label="Durchschnitt" value={avgHr} unit="bpm" status={avgHr > 100 ? 'warning' : 'normal'} />
          <StatCard label="Max (30 Tage)" value={maxHr} unit="bpm" status={maxHr > 150 ? 'danger' : 'normal'} />
        </div>
        <Card title="Herzfrequenz (30 Tage)">
          {hr30.length > 0 ? (
            <HeartRateChart data={hr30.map((m: any) => ({ measuredAt: m.measuredAt, value: Number(m.value) }))} />
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">Keine Daten</p>
          )}
        </Card>
      </section>

      {/* ── Gewicht ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">Gewicht</h2>
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Aktuelles Gewicht"
            value={latestWeight.toFixed(1)}
            unit="kg"
            status="normal"
          />
          <StatCard
            label="BMI"
            value={bmi}
            unit={bmiCategory}
            status={bmi < 25 ? 'normal' : bmi < 30 ? 'warning' : 'danger'}
          />
          <StatCard
            label="Veränderung (90 Tage)"
            value={weightChange > 0 ? `+${weightChange}` : `${weightChange}`}
            unit="kg"
            status={weightChange <= 0 ? 'normal' : 'warning'}
          />
          <StatCard
            label="Messungen"
            value={weightValues.length}
            unit="Einträge"
            status="normal"
          />
        </div>
        <Card title="Gewichtsverlauf (90 Tage)">
          {weight90.length > 0 ? (
            <WeightChart data={weight90.map((m: any) => ({ measuredAt: m.measuredAt, value: Number(m.value) }))} />
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">Keine Daten</p>
          )}
        </Card>
      </section>

      {/* ── Schlaf ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">Schlaf</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Ø Schlafdauer (14 Tage)"
            value={avgSleep}
            unit="Stunden"
            status={avgSleep >= 7 ? 'normal' : avgSleep >= 6 ? 'warning' : 'danger'}
          />
          <StatCard
            label="Nächte unter 6h"
            value={nightsUnder6}
            unit={`von ${sleepValues.length}`}
            status={nightsUnder6 >= 4 ? 'danger' : nightsUnder6 >= 2 ? 'warning' : 'normal'}
          />
          <StatCard
            label="Beste Nacht"
            value={sleepValues.length > 0 ? Math.max(...sleepValues).toFixed(1) : '–'}
            unit="Stunden"
            status="normal"
          />
        </div>
        <Card title="Schlafqualität (14 Tage)">
          {sleep14.length > 0 ? (
            <SleepChart data={sleep14.map((m: any) => ({ measuredAt: m.measuredAt, value: Number(m.value) }))} />
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">Keine Daten</p>
          )}
        </Card>
      </section>
    </div>
  )
}
