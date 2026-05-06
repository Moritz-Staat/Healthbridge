'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Props {
  medicationId: string
  takenToday: boolean
}

export function MedicationActions({ medicationId, takenToday }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSkipForm, setShowSkipForm] = useState(false)
  const [skipReason, setSkipReason] = useState('')

  async function handleTaken() {
    if (!session) return
    setLoading(true)
    await api.logTaken(session.user.accessToken, medicationId)
    router.refresh()
    setLoading(false)
  }

  async function handleSkipped() {
    if (!session) return
    setLoading(true)
    await api.logSkipped(session.user.accessToken, medicationId, skipReason)
    setShowSkipForm(false)
    router.refresh()
    setLoading(false)
  }

  if (takenToday) return null

  return (
    <div className="mt-4 flex gap-2 flex-wrap">
      <button
        onClick={handleTaken}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition"
      >
        Eingenommen
      </button>
      <button
        onClick={() => setShowSkipForm(!showSkipForm)}
        disabled={loading}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-60 transition"
      >
        Übersprungen
      </button>

      {showSkipForm && (
        <div className="w-full flex gap-2 mt-2">
          <input
            value={skipReason}
            onChange={e => setSkipReason(e.target.value)}
            placeholder="Grund (optional)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            onClick={handleSkipped}
            disabled={loading}
            className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-600 transition"
          >
            Bestätigen
          </button>
        </div>
      )}
    </div>
  )
}
