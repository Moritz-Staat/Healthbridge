'use client'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { Alert, ALERT_TYPE_LABELS } from '@healthbridge/shared-types'
import clsx from 'clsx'

interface Props { patientId: string }

export function AlertListener({ patientId }: Props) {
  const [toasts, setToasts] = useState<(Alert & { key: number })[]>([])

  useEffect(() => {
    // Derive API URL from current host at runtime (avoids Next.js build-time baking issue)
    const apiUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:4000'
      : `${window.location.protocol}//healthbridge-api.${window.location.hostname.replace('healthbridge.', '')}`
    const socket = io(apiUrl, { transports: ['websocket', 'polling'] })
    socket.emit('join', `patient:${patientId}`)

    socket.on('alert:new', (alert: Alert) => {
      const key = Date.now()
      setToasts(prev => [...prev, { ...alert, key }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.key !== key)), 5000)
    })

    return () => { socket.disconnect() }
  }, [patientId])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map(toast => (
        <div
          key={toast.key}
          className={clsx(
            'rounded-xl shadow-lg px-4 py-3 text-white text-sm max-w-sm',
            toast.severity === 'CRITICAL' ? 'bg-red-600' :
            toast.severity === 'HIGH' ? 'bg-orange-500' :
            toast.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
          )}
        >
          <p className="font-semibold">{ALERT_TYPE_LABELS[toast.alertType]}</p>
          <p className="opacity-90">{toast.message}</p>
        </div>
      ))}
    </div>
  )
}
