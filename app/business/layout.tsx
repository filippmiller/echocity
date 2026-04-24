'use client'

import { BusinessShell } from '@/components/layout/BusinessShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary scope="business">
      <BusinessShell>{children}</BusinessShell>
    </ErrorBoundary>
  )
}
