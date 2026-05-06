import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NavBar } from '@/components/ui/NavBar'

const NAV_ITEMS = [
  { href: '/family/dashboard', label: 'Übersicht' },
  { href: '/family/alerts', label: 'Warnungen' },
]

export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'FAMILY_MEMBER') redirect('/login')
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar items={NAV_ITEMS} userName={session.user.email ?? ''} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
