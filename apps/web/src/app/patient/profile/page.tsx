import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default async function ProfilePage() {
  const session = await auth()
  const token = session!.user.accessToken
  const patient = await api.getPatient(token) as any
  const family = await api.getFamily(token, patient.id) as any[]

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Profil</h1>

      <Card title="Persönliche Daten">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium">{patient.fullName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Geburtsdatum</dt>
            <dd className="font-medium">{format(new Date(patient.dateOfBirth), "d. MMMM yyyy", { locale: de })}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Telefon</dt>
            <dd className="font-medium">{patient.phone ?? '–'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Einwilligung</dt>
            <dd className={patient.consentGiven ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {patient.consentGiven ? 'Erteilt' : 'Nicht erteilt'}
            </dd>
          </div>
          {patient.insurance && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Krankenkasse</dt>
              <dd className="font-medium">{patient.insurance.name}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card title="Angehörige">
        {family.length === 0 ? (
          <p className="text-gray-400 text-sm">Keine Angehörigen eingetragen</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {family.map((f: any) => (
              <li key={f.id} className="py-3">
                <p className="font-medium text-sm">{f.fullName}</p>
                <p className="text-xs text-gray-500">{f.relationship} · {f.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Benachrichtigungen: {f.notificationsEnabled ? 'An' : 'Aus'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
