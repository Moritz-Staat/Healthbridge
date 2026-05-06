import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, Badge } from '@/components/ui/Card'
import { format, isPast } from 'date-fns'
import { de } from 'date-fns/locale'

export default async function AppointmentsPage() {
  const session = await auth()
  const token = session!.user.accessToken
  const patient = await api.getPatient(token) as any
  const appointments = await api.getAppointments(token, patient.id) as any[]

  const upcoming = appointments.filter(a => !isPast(new Date(a.appointmentDate)))
  const past = appointments.filter(a => isPast(new Date(a.appointmentDate)))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Termine</h1>

      <Card title={`Kommende Termine (${upcoming.length})`}>
        {upcoming.length === 0 ? (
          <p className="text-gray-400 text-sm">Keine bevorstehenden Termine</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcoming.map(a => (
              <li key={a.id} className="py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-blue-600 mt-0.5">
                      {format(new Date(a.appointmentDate), "EEEE, d. MMMM yyyy · HH:mm", { locale: de })} Uhr
                    </p>
                    {a.doctorName && <p className="text-sm text-gray-500 mt-1">{a.doctorName}</p>}
                    {a.location && <p className="text-sm text-gray-500">{a.location}</p>}
                    {a.notes && <p className="text-sm text-gray-400 mt-1">{a.notes}</p>}
                  </div>
                  <Badge variant="default">Offen</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {past.length > 0 && (
        <Card title="Vergangene Termine">
          <ul className="divide-y divide-gray-100">
            {past.slice(0, 5).map(a => (
              <li key={a.id} className="py-3 opacity-60">
                <p className="font-medium text-sm">{a.title}</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(a.appointmentDate), "d. MMM yyyy", { locale: de })}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
