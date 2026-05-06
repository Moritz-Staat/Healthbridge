import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, Badge } from '@/components/ui/Card'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { DispenserSimulateButton } from '@/components/patient/DispenserSimulateButton'

const FREQUENCY_LABELS: Record<string, string[]> = {
  ONCE_DAILY: ['08:00'],
  TWICE_DAILY: ['08:00', '20:00'],
  THREE_TIMES_DAILY: ['08:00', '13:00', '20:00'],
  WEEKLY_ONCE: ['Mo 08:00'],
  AS_NEEDED: ['Bei Bedarf'],
}

export default async function DispenserPage() {
  const session = await auth()
  const token = session!.user.accessToken
  const patient = await api.getPatient(token) as any
  const status = await api.getDispenserStatus(token, patient.id) as any

  if (!status.hasDispenser) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Smart Dispenser</h1>
        <Card>
          <div className="text-center py-10">
            <div className="text-5xl mb-4">💊</div>
            <h2 className="text-lg font-semibold text-gray-700">Kein Dispenser verbunden</h2>
            <p className="text-gray-400 text-sm mt-2">
              Verbinde deinen HealthBridge Smart Dispenser, um die automatische Medikamentenvergabe zu nutzen.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const device = status.device
  const medications = status.medications ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Smart Dispenser</h1>

      {/* Device Status */}
      <Card title="Gerätestatus">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-gray-800">{device.deviceName}</span>
              <Badge variant="success">Online</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-500 mt-3">
              <dt>Seriennummer</dt>
              <dd className="font-medium text-gray-700">{device.serialNumber}</dd>
              <dt>Verbunden seit</dt>
              <dd className="font-medium text-gray-700">
                {format(new Date(device.connectedSince), 'd. MMMM yyyy', { locale: de })}
              </dd>
              {status.lastDispensedAt && (
                <>
                  <dt>Letzte Ausgabe</dt>
                  <dd className="font-medium text-gray-700">
                    {format(new Date(status.lastDispensedAt), "d. MMM yyyy, HH:mm", { locale: de })} Uhr
                    {status.lastMedication && ` · ${status.lastMedication}`}
                  </dd>
                </>
              )}
            </dl>
          </div>
          <div className="text-6xl opacity-80">🤖</div>
        </div>
      </Card>

      {/* Scheduled Medications */}
      <Card title="Dosierungsplan">
        <div className="space-y-4">
          {medications.map((med: any) => {
            const schedule = FREQUENCY_LABELS[med.frequency] ?? ['–']
            const takenToday = med.logs.some((l: any) => {
              const today = new Date()
              return new Date(l.takenAt).toDateString() === today.toDateString() && l.confirmed
            })
            const skippedToday = med.logs.some((l: any) => {
              const today = new Date()
              return new Date(l.takenAt).toDateString() === today.toDateString() && !l.confirmed
            })

            return (
              <div key={med.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{med.name}</h3>
                      <Badge variant={takenToday ? 'success' : skippedToday ? 'warning' : 'default'}>
                        {takenToday ? '✓ Heute ausgegeben' : skippedToday ? '⚠ Übersprungen' : '⏳ Ausstehend'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{med.dosage} &middot; {schedule.join(', ')} Uhr</p>
                    {med.notes && <p className="text-xs text-gray-400 mt-1">{med.notes}</p>}
                  </div>
                  {!takenToday && (
                    <DispenserSimulateButton
                      patientId={patient.id}
                      medicationId={med.id}
                      medicationName={med.name}
                    />
                  )}
                </div>

                {/* Recent logs */}
                {med.logs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 mb-1">Letzte Ausgaben:</p>
                    <div className="flex flex-wrap gap-1">
                      {med.logs.slice(0, 5).map((log: any) => (
                        <span key={log.id} className={`text-xs px-2 py-0.5 rounded-full ${
                          log.confirmed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {format(new Date(log.takenAt), "d. MMM HH:mm", { locale: de })}
                          {!log.confirmed && log.skippedReason ? ` · ${log.skippedReason}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* API Integration Info */}
      <Card title="Hardware-Integration (Entwickler)">
        <p className="text-sm text-gray-500 mb-3">
          Der Smart Dispenser kommuniziert über folgenden Webhook-Endpoint:
        </p>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono space-y-2">
          <p className="text-green-400">POST /api/dispenser/webhook/{device.id}</p>
          <p className="text-gray-400">Header: X-Device-Token: [device-secret]</p>
          <p className="text-gray-400">Body:</p>
          <pre className="text-yellow-300">{JSON.stringify({
            medicationId: "<medication-id>",
            dispensedAt: "2024-01-15T08:05:00Z",
            confirmed: true
          }, null, 2)}</pre>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Geräte-ID: <code className="bg-gray-100 px-1 rounded">{device.id}</code>
        </p>
      </Card>
    </div>
  )
}
