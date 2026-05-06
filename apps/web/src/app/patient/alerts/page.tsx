import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, Badge } from '@/components/ui/Card'
import { Alert, ALERT_TYPE_LABELS } from '@healthbridge/shared-types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { ResolveAlertButton } from '@/components/patient/ResolveAlertButton'

export default async function AlertsPage() {
  const session = await auth()
  const token = session!.user.accessToken
  const patient = await api.getPatient(token) as any
  const alerts = await api.getAlerts(token, patient.id) as Alert[]

  const unresolved = alerts.filter(a => !a.resolved)
  const resolved = alerts.filter(a => a.resolved)

  const severityVariant = (s: string) =>
    s === 'CRITICAL' || s === 'HIGH' ? 'danger' : s === 'MEDIUM' ? 'warning' : 'default'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Warnungen</h1>

      <Card title={`Offen (${unresolved.length})`}>
        {unresolved.length === 0 ? (
          <p className="text-gray-400 text-sm">Keine offenen Warnungen</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {unresolved.map(alert => (
              <li key={alert.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
                  <div>
                    <p className="text-sm font-medium">{ALERT_TYPE_LABELS[alert.alertType]}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(alert.triggeredAt), "d. MMM yyyy, HH:mm", { locale: de })} Uhr
                    </p>
                  </div>
                </div>
                <ResolveAlertButton alertId={alert.id} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {resolved.length > 0 && (
        <Card title={`Erledigt (${resolved.length})`}>
          <ul className="divide-y divide-gray-100">
            {resolved.slice(0, 10).map(alert => (
              <li key={alert.id} className="py-3 flex items-start gap-3 opacity-60">
                <Badge variant="default">{alert.severity}</Badge>
                <div>
                  <p className="text-sm font-medium">{ALERT_TYPE_LABELS[alert.alertType]}</p>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
