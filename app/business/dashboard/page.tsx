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
    <div className="px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Панель управления</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Точек</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalPlaces}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Предложений</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalOffers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Сегодня</p>
          <p className="text-2xl font-bold text-deal-savings mt-1">{todayRedemptions}</p>
          <p className="text-xs text-gray-400 mt-0.5">использований</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">За неделю</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">{weeklyUniqueUsers.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">уник. клиентов</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link
          href="/business/scanner"
          className="flex items-center gap-3 bg-deal-savings text-white rounded-xl p-4 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Сканер</p>
            <p className="text-sm opacity-80">Сканировать QR-коды</p>
          </div>
        </Link>

        <Link
          href="/business/offers/create"
          className="flex items-center gap-3 bg-brand-600 text-white rounded-xl p-4 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Новое предложение</p>
            <p className="text-sm opacity-80">Создать акцию</p>
          </div>
        </Link>

        <Link
          href="/business/staff"
          className="flex items-center gap-3 bg-deal-premium text-white rounded-xl p-4 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Сотрудники</p>
            <p className="text-sm opacity-80">Управление персоналом</p>
          </div>
        </Link>
      </div>

      {/* Businesses list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center px-4 py-4 sm:px-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Мои заведения</h2>
          <Link href="/business/places" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
            Все заведения
          </Link>
        </div>

        {businesses.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">У вас пока нет заведений</p>
            <Link
              href="/business/register"
              className="inline-block bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Зарегистрировать первое
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {businesses.map((business) => (
              <div key={business.id} className="px-4 py-4 sm:px-5">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{business.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {business._count.places} точек &middot; {business._count.offers} предложений &middot; {business._count.redemptions} использований
                    </p>
                  </div>
                  <Link
                    href="/business/places"
                    className="shrink-0 ml-3 text-brand-600 hover:text-brand-700 text-sm font-medium"
                  >
                    Управлять
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
