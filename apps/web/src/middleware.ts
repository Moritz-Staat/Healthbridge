import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const roleHomePages: Record<string, string> = {
  PATIENT: '/patient/dashboard',
  FAMILY_MEMBER: '/family/dashboard',
  INSURANCE_ADMIN: '/insurance/dashboard',
  SYSTEM_ADMIN: '/admin',
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const role = req.auth?.user?.role

  if (!req.auth && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (req.auth && pathname === '/') {
    return NextResponse.redirect(new URL(roleHomePages[role!] ?? '/login', req.url))
  }

  if (role === 'PATIENT' && pathname.startsWith('/insurance')) {
    return NextResponse.redirect(new URL('/patient/dashboard', req.url))
  }
  if (role === 'INSURANCE_ADMIN' && pathname.startsWith('/patient')) {
    return NextResponse.redirect(new URL('/insurance/dashboard', req.url))
  }
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
