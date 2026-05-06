import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { StatCard, Card, Badge } from '@/components/ui/Card'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default async function InsuranceDashboard() {
  const session = await auth()
  const token = session!.user.accessToken

  const [adminData, stats, patients] = await Promise.all([
    api.getInsuranceMe(token) as Promise<any>,
    api.getInsuranceStats(token) as Promise<any>,
    api.getInsurancePatients(token) as Promise<any[]>,
  ])

  // Fetch bonus + alert data for each patient
  const patientDetails = await Promise.all(
    patients.map(async (p: any) => {
      try {
        const [bonus, alerts] = await Promise.all([
          api.getBonus(token, p.id) as Promise<{ total: number; entries?: any[] }>,
          api.getAlerts(token, p.id, false) as Promise<any[]>,
        ])
        return { ...p, bonusTotal: bonus.total ?? 0, openAlerts: alerts }
      } catch {
        return { ...p, bonusTotal: 0, openAlerts: [] }
      }
    })
  )

  // Sort patients by bonus points desc for top earners table
  const topEarners = [...patientDetails].sort((a, b) => b.bonusTotal - a.bonusTotal).slice(0, 5)

  // Alert breakdown by severity
  const allAlerts = patientDetails.flatMap((p) => p.openAlerts)
  const alertCounts = {
    CRITICAL: allAlerts.filter((a: any) => a.severity === 'CRITICAL').length,
    HIGH: allAlerts.filter((a: any) => a.severity === 'HIGH').length,
    MEDIUM: allAlerts.filter((a: any) => a.severity === 'MEDIUM').length,
    LOW: allAlerts.filter((a: any) => a.severity === 'LOW').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {adminData?.insurance?.name ?? 'Insurance Dashboard'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Bonus-Programm:{' '}
          {adminData?.insurance?.bonusProgramActive ? (
            <span className="text-green-600 font-medium">Aktiv</span>
          ) : (
            <span className="text-red-500 font-medium">Inaktiv</span>
          )}
          {' · '}
          {format(new Date(), "d. MMMM yyyy", { locale: de })}
        </p>
      </div>

      {/* Row 1 — Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Versicherte Patienten"
          value={stats.patientCount}
          status="normal"
        />
        <StatCard
          label="Vergebene Bonuspunkte"
          value={stats.totalBonusAwarded.toLocaleString('de')}
          unit="Pkt."
          status="normal"
        />
        <StatCard
          label="Offene Warnungen"
          value={stats.unresolvedAlerts}
          status={stats.unresolvedAlerts > 10 ? 'danger' : stats.unresolvedAlerts > 3 ? 'warning' : 'normal'}
        />
        <StatCard
          label="Ø Bonuspunkte/Patient"
          value={stats.patientCount > 0 ? Math.round(stats.totalBonusAwarded / stats.patientCount) : 0}
          unit="Pkt."
          status="normal"
        />
      </div>

      {/* Row 2 — Alert Breakdown + Top Earners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alert Severity Overview */}
        <Card title="Warnungen nach Schweregrad">
          {stats.unresolvedAlerts === 0 ? (
            <div className="py-6 text-center">
              <p className="text-3xl mb-2">✓</p>
              <p className="text-green-600 font-medium">Keine offenen Warnungen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Kritisch', key: 'CRITICAL', color: '#dc2626', bg: 'bg-red-50' },
                { label: 'Hoch', key: 'HIGH', color: '#dc2626', bg: 'bg-red-50' },
                { label: 'Mittel', key: 'MEDIUM', color: '#d97706', bg: 'bg-yellow-50' },
                { label: 'Niedrig', key: 'LOW', color: '#6b7280', bg: 'bg-gray-50' },
              ].map(({ label, key, color, bg }) => {
                const count = alertCounts[key as keyof typeof alertCounts]
                const pct = allAlerts.length > 0 ? Math.round((count / allAlerts.length) * 100) : 0
                return (
                  <div key={key} className={`flex items-center justify-between p-3 rounded-lg ${bg}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-6 text-right">{count}</span>
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-gray-400 text-right pt-1">
                {allAlerts.length} Warnungen gesamt
              </p>
            </div>
          )}
        </Card>

        {/* Top Bonus Earners */}
        <Card title="Top Bonus-Empfänger">
          {topEarners.length === 0 ? (
            <p className="text-gray-400 text-sm">Keine Daten</p>
          ) : (
            <div className="space-y-3">
              {topEarners.map((p: any, idx: number) => {
                const medals = ['🥇', '🥈', '🥉', '4.', '5.']
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-lg w-7 flex-shrink-0 text-center">{medals[idx]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{p.fullName}</p>
                      <p className="text-xs text-gray-500">{p.user?.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-blue-600">{p.bonusTotal.toLocaleString('de')}</p>
                      <p className="text-xs text-gray-400">Pkt.</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Row 3 — Patients Table */}
      <Card title="Alle Versicherten">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b text-xs uppercase tracking-wide">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">E-Mail</th>
                <th className="pb-3 pr-4">Einwilligung</th>
                <th className="pb-3 pr-4">Bonuspunkte</th>
                <th className="pb-3">Off. Warnungen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patientDetails.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-gray-900">{p.fullName}</td>
                  <td className="py-3 pr-4 text-gray-500">{p.user?.email}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={p.consentGiven ? 'success' : 'danger'}>
                      {p.consentGiven ? 'Ja' : 'Nein'}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-blue-600">{p.bonusTotal.toLocaleString('de')}</span>
                    <span className="text-gray-400 text-xs ml-1">Pkt.</span>
                  </td>
                  <td className="py-3">
                    {p.openAlerts.length === 0 ? (
                      <Badge variant="success">Keine</Badge>
                    ) : (
                      <Badge variant={p.openAlerts.some((a: any) => a.severity === 'CRITICAL' || a.severity === 'HIGH') ? 'danger' : 'warning'}>
                        {p.openAlerts.length}
                      </Badge>
                    )}
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
