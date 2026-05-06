'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export function ResolveAlertButton({ alertId }: { alertId: string }) {
  const { data: session } = useSession()
  const router = useRouter()

  async function handleResolve() {
    if (!session) return
    await api.resolveAlert(session.user.accessToken, alertId)
    router.refresh()
  }

  return (
    <button
      onClick={handleResolve}
      className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium"
    >
      Erledigt
    </button>
  )
}
