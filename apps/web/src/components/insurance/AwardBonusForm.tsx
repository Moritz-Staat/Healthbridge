'use client'
import { useState } from 'react'
import { api } from '@/lib/api'

const CATEGORIES = [
  { value: 'MEDICATION_ADHERENCE', label: 'Medikamenten-Einnahme' },
  { value: 'ACTIVITY_GOAL', label: 'Aktivitätsziel' },
  { value: 'REGULAR_CHECK_IN', label: 'Regelmäßige Messung' },
  { value: 'HEALTH_IMPROVEMENT', label: 'Gesundheitsverbesserung' },
]

export function AwardBonusForm({ token }: { token: string }) {
  const [patientId, setPatientId] = useState('')
  const [points, setPoints] = useState(10)
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState('ACTIVITY_GOAL')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await api.awardBonus(token, { patientId, points, reason, category })
    setSuccess(true)
    setLoading(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Patienten-ID</label>
        <input
          value={patientId}
          onChange={e => setPatientId(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="cuid..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Punkte</label>
        <input
          type="number"
          value={points}
          onChange={e => setPoints(Number(e.target.value))}
          min={1}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Begründung</label>
        <input
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="z.B. Monatliches Aktivitätsziel erreicht"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
      >
        {loading ? 'Wird vergeben...' : 'Punkte vergeben'}
      </button>
      {success && <p className="text-green-600 text-sm">Bonuspunkte erfolgreich vergeben!</p>}
    </form>
  )
}
