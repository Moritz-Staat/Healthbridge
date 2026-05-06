'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Props {
  patientId: string
  medicationId: string
  medicationName: string
}

export function DispenserSimulateButton({ patientId, medicationId, medicationName }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSimulate() {
    if (!session) return
    setLoading(true)
    await api.simulateDispense(session.user.accessToken, patientId, medicationId)
    setDone(true)
    setLoading(false)
    setTimeout(() => router.refresh(), 500)
  }

  if (done) return (
    <span className="text-green-600 text-sm font-medium">✓ Ausgegeben</span>
  )

  return (
    <button
      onClick={handleSimulate}
      disabled={loading}
      className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
      title="Simuliert die Ausgabe durch den physischen Dispenser"
    >
      🤖 {loading ? 'Ausgabe...' : 'Dispenser auslösen'}
    </button>
  )
}
