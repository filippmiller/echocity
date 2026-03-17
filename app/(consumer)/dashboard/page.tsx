import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/auth/login')
  }

  if (session.role === 'BUSINESS_OWNER') {
    redirect('/business/dashboard')
  }

  if (session.role === 'ADMIN') {
    redirect('/admin')
  }

  // Citizens go to profile
  redirect('/profile')
}
