import type { Metadata } from 'next'
import { Providers } from '@/components/ui/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'HealthBridge',
  description: 'B2B2C Health Platform',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
