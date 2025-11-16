import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'

export default async function ApiControlPage() {
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">API Control</h1>
          <p className="mt-2 text-gray-600">Управление API ключами и доступом</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Здесь будет список API ключей и управление доступом.
                </p>
                <div className="mt-4">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                    Создать новый API ключ
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">API Usage Statistics</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Статистика использования API будет отображаться здесь.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Rate Limits</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Настройка лимитов запросов для API ключей.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

