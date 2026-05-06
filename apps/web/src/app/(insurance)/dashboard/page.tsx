import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { StatCard, Card } from '@/components/ui/Card'

export default async function InsuranceDashboard() {
  const session = await auth()
  const token = session!.user.accessToken

  const [adminData, stats, patients] = await Promise.all([
    api.getInsuranceMe(token) as Promise<any>,
    api.getInsuranceStats(token) as Promise<any>,
    api.getInsurancePatients(token) as Promise<any[]>,
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{adminData?.insurance?.name ?? 'Insurance Dashboard'}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bonus-Programm: {adminData?.insurance?.bonusProgramActive ? (
            <span className="text-green-600 font-medium">Aktiv</span>
          ) : (
            <span className="text-red-500 font-medium">Inaktiv</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Versicherte Patienten" value={stats.patientCount} status="normal" />
        <StatCard label="Vergebene Bonuspunkte" value={stats.totalBonusAwarded} unit="Pkt." status="normal" />
        <StatCard label="Offene Warnungen" value={stats.unresolvedAlerts}
          status={stats.unresolvedAlerts > 10 ? 'danger' : stats.unresolvedAlerts > 3 ? 'warning' : 'normal'} />
      </div>

      <Card title="Aktuelle Patienten">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">E-Mail</th>
                <th className="pb-2">Einwilligung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients.map((p: any) => (
                <tr key={p.id}>
                  <td className="py-2 pr-4 font-medium">{p.fullName}</td>
                  <td className="py-2 pr-4 text-gray-500">{p.user?.email}</td>
                  <td className="py-2">
                    <span className={p.consentGiven ? 'text-green-600' : 'text-red-500'}>
                      {p.consentGiven ? 'Ja' : 'Nein'}
                    </span>
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
