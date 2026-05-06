import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NavBar } from '@/components/ui/NavBar'

const NAV_ITEMS = [
  { href: '/insurance/dashboard', label: 'Dashboard' },
  { href: '/insurance/patients', label: 'Patienten' },
  { href: '/insurance/bonus', label: 'Bonus-Verwaltung' },
]

export default async function InsuranceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'INSURANCE_ADMIN') redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar items={NAV_ITEMS} userName={session.user.email ?? ''} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
