import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'

/**
 * Server-side guard for admin pages
 * Redirects to /admin if user is not ADMIN
 */
export async function requireAdmin() {
  const session = await getSession()
  
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin')
  }
  
  return session
}

