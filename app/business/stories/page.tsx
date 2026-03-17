export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function BusinessStoriesPage() {
  const session = await getSession()

  if (!session) redirect('/auth/login')
  if (session.role !== 'BUSINESS_OWNER') redirect('/')

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    select: { id: true },
  })
  const merchantIds = businesses.map((b) => b.id)

  const stories = await prisma.story.findMany({
    where: { merchantId: { in: merchantIds } },
    include: {
      branch: { select: { id: true, title: true, address: true } },
      offer: { select: { id: true, title: true } },
      _count: { select: { views: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const now = new Date()
  const activeStories = stories.filter((s) => s.isActive && s.expiresAt > now)
  const expiredStories = stories.filter((s) => !s.isActive || s.expiresAt <= now)

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Истории</h1>
        <Link
          href="/business/stories/create"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Создать историю
        </Link>
      </div>

      {/* Active stories */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Активные
          {activeStories.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({activeStories.length})
            </span>
          )}
        </h2>

        {activeStories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">У вас пока нет активных историй</p>
            <Link
              href="/business/stories/create"
              className="inline-block bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Создать первую
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeStories.map((story) => {
              const hoursLeft = Math.max(0, Math.round((story.expiresAt.getTime() - now.getTime()) / 3600000))
              return (
                <div key={story.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="relative aspect-[16/9] bg-gray-100">
                    <img
                      src={story.mediaUrl}
                      alt={story.caption || 'Story'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                      {hoursLeft}ч осталось
                    </div>
                  </div>
                  <div className="p-3">
                    {story.caption && (
                      <p className="text-sm text-gray-900 line-clamp-2 mb-1">{story.caption}</p>
                    )}
                    <p className="text-xs text-gray-500">{story.branch.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {story._count.views} просмотров
                      </span>
                      {story.offer && (
                        <span className="text-xs text-brand-600 font-medium">
                          {story.offer.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Expired stories */}
      {expiredStories.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Завершённые
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({expiredStories.length})
            </span>
          </h2>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {expiredStories.map((story) => (
              <div key={story.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  <img
                    src={story.mediaUrl}
                    alt=""
                    className="w-full h-full object-cover opacity-60"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 truncate">
                    {story.caption || 'Без подписи'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {story.branch.title} &middot; {story._count.views} просмотров
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(story.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
