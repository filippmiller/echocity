import Link from "next/link"

const CATEGORIES = [
  { name: 'Кофе', slug: 'coffee', emoji: 'C' },
  { name: 'Еда', slug: 'food', emoji: 'F' },
  { name: 'Бары', slug: 'bars', emoji: 'B' },
  { name: 'Красота', slug: 'beauty', emoji: 'K' },
  { name: 'Услуги', slug: 'services', emoji: 'U' },
]

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Скидки в лучших местах вашего города
          </h1>
          <p className="text-lg text-blue-100 mb-8">
            Находите предложения, активируйте через QR и экономьте каждый день
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/offers"
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50"
            >
              Смотреть скидки
            </Link>
            <Link
              href="/map"
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-400"
            >
              На карте
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/search?category=${cat.slug}`}
                className="flex flex-col items-center gap-1 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 shrink-0"
              >
                <span className="text-2xl w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">{cat.emoji}</span>
                <span className="text-xs text-gray-700 font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For Business */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Для бизнеса</h2>
          <p className="text-gray-600 mb-6">
            Привлекайте новых клиентов, создавайте предложения и отслеживайте результаты
          </p>
          <Link
            href="/business/register"
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800"
          >
            Подключить заведение
          </Link>
        </div>
      </section>

      {/* Subscription CTA */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Подписка Plus</h2>
          <p className="text-gray-600 mb-6">
            Эксклюзивные скидки от лучших заведений. 7 дней бесплатно.
          </p>
          <Link
            href="/subscription"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
          >
            Узнать подробнее
          </Link>
        </div>
      </section>

      {/* Auth */}
      <section className="py-8 px-4 border-t">
        <div className="max-w-4xl mx-auto flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Войти
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Регистрация
          </Link>
        </div>
      </section>
    </main>
  )
}
