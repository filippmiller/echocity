export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { RespondButton } from './respond-button'

export default async function BusinessDemandPage() {
  const session = await getSession()

  if (!session) redirect('/auth/login')
  if (session.role !== 'BUSINESS_OWNER') redirect('/')

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    select: { id: true, name: true },
  })
  const merchantIds = businesses.map((b) => b.id)

  if (merchantIds.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-5">Входящие запросы</h1>
        <div className="text-center py-10">
          <p className="text-gray-500">Сначала зарегистрируйте бизнес</p>
          <Link
            href="/business/register"
            className="mt-4 inline-block bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Регистрация
          </Link>
        </div>
      </div>
    )
  }

  // Get all places belonging to merchant
  const places = await prisma.place.findMany({
    where: { businessId: { in: merchantIds }, isActive: true },
    select: { id: true },
  })
  const placeIds = places.map((p) => p.id)

  // Fetch active demands for merchant's places
  const demands = placeIds.length > 0
    ? await prisma.demandRequest.findMany({
        where: {
          placeId: { in: placeIds },
          status: { in: ['OPEN', 'COLLECTING'] },
        },
        include: {
          place: {
            select: { id: true, title: true, address: true, city: true },
          },
          category: {
            select: { id: true, name: true },
          },
          responses: {
            where: { merchantId: { in: merchantIds } },
            include: {
              offer: {
                select: { id: true, title: true },
              },
            },
          },
          _count: {
            select: { supports: true },
          },
        },
        orderBy: { supportCount: 'desc' },
        take: 50,
      })
    : []

  // Fetch merchant's existing offers for the quick-link dropdown
  const offers = await prisma.offer.findMany({
    where: {
      merchantId: { in: merchantIds },
      lifecycleStatus: 'ACTIVE',
    },
    select: { id: true, title: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Входящие запросы</h1>
        <Link
          href="/business/dashboard"
          className="text-brand-600 hover:text-brand-700 text-sm font-medium"
        >
          Панель
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Всего</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{demands.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Без ответа</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {demands.filter((d) => d.responses.length === 0).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Отвечено</p>
          <p className="text-2xl font-bold text-deal-savings mt-1">
            {demands.filter((d) => d.responses.length > 0).length}
          </p>
        </div>
      </div>

      {demands.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-10 px-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-1">Пока нет запросов от пользователей</p>
          <p className="text-sm text-gray-400">
            Когда клиенты захотят акцию у вас, запрос появится здесь
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {demands.map((demand) => {
            const hasResponse = demand.responses.length > 0
            const response = hasResponse ? demand.responses[0] : null

            return (
              <div
                key={demand.id}
                className={`bg-white rounded-xl shadow-sm border p-4 ${
                  hasResponse ? 'border-green-200' : 'border-gray-100'
                }`}
              >
                {/* Header row */}
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {demand.place?.title ?? demand.placeName ?? 'Без места'}
                    </h3>
                    {demand.place && (
                      <p className="text-sm text-gray-500 truncate">
                        {demand.place.address}, {demand.place.city}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <span className="text-sm font-bold text-amber-600">
                      {demand.supportCount}
                    </span>
                    <span className="text-xs text-gray-400">голосов</span>
                  </div>
                </div>

                {/* Category badge */}
                {demand.category && (
                  <span className="inline-block text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full mb-2">
                    {demand.category.name}
                  </span>
                )}

                {/* Status badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      demand.status === 'OPEN'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {demand.status === 'OPEN' ? 'Новый' : 'Сбор ответов'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(demand.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                {/* Response section */}
                {hasResponse && response ? (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-green-700">Вы ответили</span>
                    </div>
                    {response.message && (
                      <p className="text-sm text-green-800 mt-1">{response.message}</p>
                    )}
                    {response.offer && (
                      <p className="text-sm text-green-700 mt-1">
                        Привязано предложение:{' '}
                        <Link
                          href={`/business/offers`}
                          className="font-medium underline hover:no-underline"
                        >
                          {response.offer.title}
                        </Link>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <RespondButton
                      demandRequestId={demand.id}
                      offers={offers}
                    />
                    <Link
                      href={`/business/offers/create`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Создать акцию
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
