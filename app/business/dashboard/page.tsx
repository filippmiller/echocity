import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function BusinessDashboardPage() {
  const session = await getSession()

  if (!session) redirect('/auth/login')
  if (session.role !== 'BUSINESS_OWNER') redirect('/')

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    include: {
      places: { where: { isActive: true }, take: 5, orderBy: { createdAt: 'desc' } },
      _count: { select: { places: true, offers: true, redemptions: true } },
    },
  })

  const merchantIds = businesses.map((b) => b.id)
  const totalPlaces = businesses.reduce((sum, biz) => sum + biz._count.places, 0)
  const totalOffers = businesses.reduce((sum, biz) => sum + biz._count.offers, 0)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayRedemptions = await prisma.redemption.count({
    where: { merchantId: { in: merchantIds }, redeemedAt: { gte: todayStart } },
  })

  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)
  const weeklyUniqueUsers = await prisma.redemption.groupBy({
    by: ['userId'],
    where: { merchantId: { in: merchantIds }, redeemedAt: { gte: weekStart } },
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Панель управления</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Точек</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalPlaces}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Предложений</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalOffers}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Сегодня</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">{todayRedemptions}</p>
            <p className="text-xs text-gray-400">использований</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase">За неделю</h3>
            <p className="text-2xl font-bold text-blue-600 mt-1">{weeklyUniqueUsers.length}</p>
            <p className="text-xs text-gray-400">уник. клиентов</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Link href="/business/scanner" className="bg-green-600 text-white rounded-lg p-5 hover:bg-green-700 text-center">
            <p className="text-lg font-bold">Сканер</p>
            <p className="text-sm opacity-80">Сканировать QR-коды</p>
          </Link>
          <Link href="/business/offers/create" className="bg-blue-600 text-white rounded-lg p-5 hover:bg-blue-700 text-center">
            <p className="text-lg font-bold">Новое предложение</p>
            <p className="text-sm opacity-80">Создать акцию</p>
          </Link>
          <Link href="/business/staff" className="bg-purple-600 text-white rounded-lg p-5 hover:bg-purple-700 text-center">
            <p className="text-lg font-bold">Сотрудники</p>
            <p className="text-sm opacity-80">Управление персоналом</p>
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Мои заведения</h2>
            <Link href="/business/places" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Все заведения
            </Link>
          </div>

          {businesses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">У вас пока нет заведений</p>
              <Link href="/business/register" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
                Зарегистрировать первое заведение
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {businesses.map((business) => (
                <div key={business.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{business.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {business._count.places} точек, {business._count.offers} предложений, {business._count.redemptions} использований
                      </p>
                    </div>
                    <Link href="/business/places" className="text-blue-600 hover:text-blue-700 text-sm">
                      Управлять
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
