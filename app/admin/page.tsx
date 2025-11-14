import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'

export default async function AdminPage() {
  const session = await getSession()

  if (!session) {
    redirect('/auth/login')
  }

  if (session.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Panel</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-700">
            Добро пожаловать в админ-панель, {session.email}!
          </p>
          <p className="text-gray-600 mt-2">
            Здесь будет панель администратора для управления платформой.
          </p>
        </div>
      </div>
    </div>
  )
}

