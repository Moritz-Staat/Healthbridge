import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

const roleRedirects: Record<string, string> = {
  PATIENT: '/patient/dashboard',
  FAMILY_MEMBER: '/family/dashboard',
  INSURANCE_ADMIN: '/insurance/dashboard',
  SYSTEM_ADMIN: '/admin',
}

export default async function Home() {
  const session = await auth()
  if (!session) redirect('/login')
  redirect(roleRedirects[session.user.role] ?? '/login')
}
