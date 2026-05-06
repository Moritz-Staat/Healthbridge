import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NavBar } from '@/components/ui/NavBar'

const NAV_ITEMS = [
  { href: '/patient/dashboard', label: 'Dashboard' },
  { href: '/patient/metrics', label: 'Gesundheitsdaten' },
  { href: '/patient/medications', label: 'Medikamente' },
  { href: '/patient/appointments', label: 'Termine' },
  { href: '/patient/alerts', label: 'Warnungen' },
  { href: '/patient/profile', label: 'Profil' },
]

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'PATIENT') redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar items={NAV_ITEMS} userName={session.user.email ?? ''} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
