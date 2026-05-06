import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, Badge } from '@/components/ui/Card'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default async function InsurancePatientsPage() {
  const session = await auth()
  const token = session!.user.accessToken
  const patients = await api.getInsurancePatients(token) as any[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Patienten ({patients.length})</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 pr-6">Name</th>
                <th className="pb-3 pr-6">E-Mail</th>
                <th className="pb-3 pr-6">Geburtsdatum</th>
                <th className="pb-3">Einwilligung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-6 font-medium">{p.fullName}</td>
                  <td className="py-3 pr-6 text-gray-500">{p.user?.email}</td>
                  <td className="py-3 pr-6 text-gray-500">
                    {format(new Date(p.dateOfBirth), "d. MMM yyyy", { locale: de })}
                  </td>
                  <td className="py-3">
                    <Badge variant={p.consentGiven ? 'success' : 'danger'}>
                      {p.consentGiven ? 'Erteilt' : 'Ausstehend'}
                    </Badge>
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
