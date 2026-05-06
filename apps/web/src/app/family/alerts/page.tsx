import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, Badge } from '@/components/ui/Card'
import { ALERT_TYPE_LABELS } from '@healthbridge/shared-types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default async function FamilyAlertsPage() {
  const session = await auth()
  const token = session!.user.accessToken
  const patients = await api.getFamilyPatients(token) as any[]

  const allAlerts = (await Promise.all(
    patients.map(async p => {
      const alerts = await api.getFamilyAlerts(token, p.id).catch(() => []) as any[]
      return alerts.map((a: any) => ({ ...a, patientName: p.fullName }))
    })
  )).flat().sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())

  const unresolved = allAlerts.filter(a => !a.resolved)
  const resolved = allAlerts.filter(a => a.resolved)

  const severityVariant = (s: string): 'danger' | 'warning' | 'default' =>
    s === 'CRITICAL' || s === 'HIGH' ? 'danger' : s === 'MEDIUM' ? 'warning' : 'default'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alle Warnungen</h1>

      <Card title={`Offen (${unresolved.length})`}>
        {unresolved.length === 0 ? (
          <p className="text-gray-400 text-sm">Keine offenen Warnungen</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {unresolved.map(alert => (
              <li key={alert.id} className="py-3 flex items-start gap-3">
                <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{ALERT_TYPE_LABELS[alert.alertType as keyof typeof ALERT_TYPE_LABELS]}</p>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {alert.patientName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(alert.triggeredAt), "d. MMM yyyy, HH:mm", { locale: de })} Uhr
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {resolved.length > 0 && (
        <Card title={`Erledigt (${resolved.length})`}>
          <ul className="divide-y divide-gray-100">
            {resolved.slice(0, 15).map(alert => (
              <li key={alert.id} className="py-3 flex items-start gap-3 opacity-60">
                <Badge variant="default">{alert.severity}</Badge>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{ALERT_TYPE_LABELS[alert.alertType as keyof typeof ALERT_TYPE_LABELS]}</p>
                    <span className="text-xs text-gray-500">{alert.patientName}</span>
                  </div>
                  <p className="text-sm text-gray-500">{alert.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
