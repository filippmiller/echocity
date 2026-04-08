import Link from 'next/link'
import type { Metadata } from 'next'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Для пользователей — ГдеСейчас',
  description: 'Находите лучшие скидки в кафе, ресторанах и салонах вашего города. Экономьте каждый день с ГдеСейчас.',
}

export default function ForUsersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-blue-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Экономьте каждый день
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            ГдеСейчас — ваш помощник в поиске лучших скидок в кафе, ресторанах, барах и салонах красоты
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-white text-brand-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              Начать экономить
            </Link>
            <Link
              href="/offers"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
            >
              Смотреть скидки
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Как это работает</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">&#x1F50D;</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Найдите скидку</h3>
              <p className="text-gray-600 text-sm">
                Выбирайте из сотен предложений рядом с вами — кофе, еда, красота, услуги
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">&#x1F4F1;</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Покажите QR-код</h3>
              <p className="text-gray-600 text-sm">
                Придите в заведение и покажите QR-код на кассе — это занимает 5 секунд
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">&#x1F389;</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Получите скидку</h3>
              <p className="text-gray-600 text-sm">
                Скидка применяется мгновенно. Отслеживайте свою экономию в приложении
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Что вы получаете</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <span className="text-2xl">&#x2615;</span>
              <h3 className="font-semibold text-gray-900 mt-3 mb-2">Скидки рядом</h3>
              <p className="text-gray-600 text-sm">
                Кафе, рестораны, бары и салоны красоты рядом с вами — с реальными скидками до 40%
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <span className="text-2xl">&#x1F3AE;</span>
              <h3 className="font-semibold text-gray-900 mt-3 mb-2">Награды и миссии</h3>
              <p className="text-gray-600 text-sm">
                Зарабатывайте XP, выполняйте миссии, получайте значки и бонусные монеты
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <span className="text-2xl">&#x1F525;</span>
              <h3 className="font-semibold text-gray-900 mt-3 mb-2">Flash-скидки</h3>
              <p className="text-gray-600 text-sm">
                Горящие предложения с ограниченным временем — успейте первыми
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <span className="text-2xl">&#x1F381;</span>
              <h3 className="font-semibold text-gray-900 mt-3 mb-2">Сюрприз-наборы</h3>
              <p className="text-gray-600 text-sm">
                Mystery-наборы от заведений по сниженной цене — не знаете, что получите, но точно будете довольны
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Подписка Plus</h2>
          <p className="text-gray-600 mb-6">
            Эксклюзивные скидки от лучших заведений. Попробуйте 7 дней бесплатно.
          </p>
          <Link
            href="/subscription"
            className="inline-block px-8 py-3 bg-deal-premium text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Попробовать бесплатно
          </Link>
          <p className="text-gray-400 text-xs mt-3">от 199 руб/мес. Отмена в любой момент.</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
