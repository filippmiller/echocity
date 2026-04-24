import { AdminShell } from '@/components/layout/AdminShell'
import { requireAdmin } from '@/lib/admin-guard'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <ErrorBoundary scope="admin">
      <AdminShell>{children}</AdminShell>
    </ErrorBoundary>
  )
}
