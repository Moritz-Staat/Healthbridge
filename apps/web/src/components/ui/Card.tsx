import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export function Card({ children, className, title }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-sm p-5', className)}>
      {title && <h2 className="text-base font-semibold text-gray-800 mb-4">{title}</h2>}
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  status?: 'normal' | 'warning' | 'danger'
  icon?: string
}

export function StatCard({ label, value, unit, status = 'normal', icon }: StatCardProps) {
  const statusColors = {
    normal: 'border-l-green-400',
    warning: 'border-l-yellow-400',
    danger: 'border-l-red-500',
  }

  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-sm p-5 border-l-4', statusColors[status])}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {icon && <span className="text-2xl mt-2 block">{icon}</span>}
    </div>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'danger' | 'warning' | 'success'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
    success: 'bg-green-100 text-green-700',
  }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant])}>
      {children}
    </span>
  )
}
