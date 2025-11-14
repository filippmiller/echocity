import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'

export default async function BusinessDashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/auth/login')
  }

  if (session.role !== 'BUSINESS_OWNER') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Business Dashboard</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-700">
            Добро пожаловать, {session.email}!
          </p>
          <p className="text-gray-600 mt-2">
            Здесь будет панель управления вашими точками и бизнесом.
          </p>
        </div>
      </div>
    </div>
  )
}

