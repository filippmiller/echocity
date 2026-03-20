import { ShieldCheck } from 'lucide-react'

interface VerifiedBadgeProps {
  size?: 'sm' | 'md'
}

export function VerifiedBadge({ size = 'md' }: VerifiedBadgeProps) {
  if (size === 'sm') {
    return (
      <span
        title="Проверено"
        className="inline-flex items-center text-blue-500 shrink-0"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-blue-500">
      <ShieldCheck className="w-4 h-4" />
      <span className="text-sm font-medium">Проверено</span>
    </span>
  )
}
