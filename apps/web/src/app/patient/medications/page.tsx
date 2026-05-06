import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Card, Badge } from '@/components/ui/Card'
import { MedicationActions } from '@/components/patient/MedicationActions'

const FREQUENCY_LABELS: Record<string, string> = {
  ONCE_DAILY: 'Einmal täglich',
  TWICE_DAILY: 'Zweimal täglich',
  THREE_TIMES_DAILY: 'Dreimal täglich',
  WEEKLY_ONCE: 'Einmal wöchentlich',
  AS_NEEDED: 'Bei Bedarf',
}

export default async function MedicationsPage() {
  const session = await auth()
  const token = session!.user.accessToken
  const patient = await api.getPatient(token) as any
  const medications = await api.getMedications(token, patient.id) as any[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Medikamente</h1>
      </div>

      {medications.length === 0 ? (
        <Card><p className="text-gray-400">Keine aktiven Medikamente</p></Card>
      ) : (
        <div className="space-y-4">
          {medications.map((med: any) => {
            const takenToday = med.logs?.some((l: any) => {
              const today = new Date(); const taken = new Date(l.takenAt)
              return taken.toDateString() === today.toDateString() && l.confirmed
            })
            return (
              <Card key={med.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{med.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {med.dosage} · {FREQUENCY_LABELS[med.frequency]}
                    </p>
                    {med.notes && <p className="text-gray-400 text-sm mt-1">{med.notes}</p>}
                  </div>
                  <Badge variant={takenToday ? 'success' : 'warning'}>
                    {takenToday ? 'Heute eingenommen' : 'Noch ausstehend'}
                  </Badge>
                </div>
                <MedicationActions medicationId={med.id} takenToday={takenToday} />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
