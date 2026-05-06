'use client'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

interface NavItem { href: string; label: string }

interface NavBarProps {
  items: NavItem[]
  userName?: string
}

export function NavBar({ items, userName }: NavBarProps) {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-blue-600 text-lg">HealthBridge</span>
        <div className="flex gap-1">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition',
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {userName && <span className="text-sm text-gray-600">{userName}</span>}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm text-gray-500 hover:text-red-600 transition"
        >
          Abmelden
        </button>
      </div>
    </nav>
  )
}
