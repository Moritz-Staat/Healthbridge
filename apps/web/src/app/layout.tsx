import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HealthBridge',
  description: 'B2B2C Health Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
