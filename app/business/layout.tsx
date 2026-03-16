'use client'

import { BusinessShell } from '@/components/layout/BusinessShell'

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <BusinessShell>{children}</BusinessShell>
}
