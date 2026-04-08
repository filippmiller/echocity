export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Footer } from '@/components/Footer'
import { QrCode, BarChart3, Users, Clock, Zap, Shield, ArrowRight, CheckCircle2, Star } from 'lucide-react'

const OFFER_TEMPLATES = [
  {
    icon: '🏷',
    name: '%-скидка на всё',
    example: '-20% на всё меню',
    description: 'Простая скидка на все товары или услуги',
    color: 'bg-red-50 border-red-200',
  },
  {
    icon: '🍽',
    name: 'Бизнес-ланч',
    example: 'Ланч за 399₽',
    description: 'Фиксированная цена на комплексный обед',
    color: 'bg-amber-50 border-amber-200',
  },
  {
    icon: '👋',
    name: 'Первый визит',
    example: '-25% для новых гостей',
    description: 'Скидка для клиентов, которые приходят впервые',
    color: 'bg-green-50 border-green-200',
  },
  {
    icon: '⏰',
    name: 'Счастливые часы',
    example: '-30% Пн-Чт 14–17',
    description: 'Скидка в непиковое время для загрузки зала',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    icon: '🎁',
    name: '2 по цене 1',
    example: '2 кофе = 1 по цене',
    description: 'Акция «приведи друга» — приходят вдвоём, платят за одного',
    color: 'bg-purple-50 border-purple-200',
  },
]

const STEPS = [
  {
    step: '1',
    icon: Shield,
    title: 'Зарегистрируйтесь',
    description: 'Заполните данные о заведении — это займёт 3 минуты. Мы проверим и активируем ваш профиль.',
    color: 'bg-blue-600',
  },
  {
    step: '2',
    icon: Zap,
    title: 'Создайте предложение',
    description: 'Выберите готовый шаблон или создайте своё. Укажите скидку, условия и расписание.',
    color: 'bg-green-600',
  },
  {
    step: '3',
    icon: Users,
    title: 'Получайте клиентов',
    description: 'Клиенты находят вашу скидку, активируют QR-код и показывают его на кассе.',
    color: 'bg-purple-600',
  },
]

const FAQ = [
  {
    q: 'Сколько стоит подключение?',
    a: 'Регистрация и размещение — бесплатно. Вы платите только за результат: 50₽ за каждого клиента, который воспользовался скидкой через наш QR-код.',
  },
  {
    q: 'Как клиенты получают скидку?',
    a: 'Клиент находит ваше предложение в приложении, нажимает «Активировать» и показывает QR-код вашему кассиру. Кассир сканирует код — скидка подтверждена.',
  },
  {
    q: 'Могу ли я приостановить предложение?',
    a: 'Да, в любой момент из личного кабинета. Вы полностью контролируете расписание, лимиты и условия каждого предложения.',
  },
  {
    q: 'Сколько времени занимает регистрация?',
    a: '3 минуты на заполнение формы. После модерации (обычно в течение часа) ваше заведение появится на платформе.',
  },
  {
    q: 'Нужно ли специальное оборудование?',
    a: 'Нет. Кассир сканирует QR-код камерой любого телефона или вводит 6-значный код вручную.',
  },
  {
    q: 'Как отслеживать результаты?',
    a: 'В личном кабинете доступна аналитика: количество просмотров, активаций, уникальных клиентов, выручка от акций.',
  },
]

async function getStats() {
  const [placeCount, offerCount, redemptionCount] = await Promise.all([
    prisma.place.count({ where: { isActive: true } }),
    prisma.offer.count({ where: { lifecycleStatus: 'ACTIVE', approvalStatus: 'APPROVED' } }),
    prisma.redemption.count({ where: { status: 'SUCCESS' } }),
  ])
  return { placeCount, offerCount, redemptionCount }
}

export default async function ForBusinessesPage() {
  const stats = await getStats()

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-8 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-300 mb-6">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            {stats.placeCount} заведений уже на платформе
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Получайте клиентов<br />
            <span className="text-blue-400">бесплатно</span>
          </h1>

          <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Разместите скидку — клиенты найдут вас сами. Вы платите только когда клиент пришёл и воспользовался предложением.
          </p>

          {/* ROI Calculator */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-lg mx-auto mb-8">
            <p className="text-sm text-gray-400 mb-3">Если 10 клиентов в день используют вашу скидку:</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-white">300</p>
                <p className="text-xs text-gray-400">новых клиентов/мес</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">15 000₽</p>
                <p className="text-xs text-gray-400">стоимость (50₽/клиент)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">~150₽</p>
                <p className="text-xs text-gray-400">средний чек × 300</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">* На каждый вложенный рубль — 3₽ выручки от новых клиентов</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/business/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30"
            >
              Подключить за 3 минуты
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
            >
              Как это работает
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-8 px-4 bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.placeCount}</p>
              <p className="text-sm text-gray-500">заведений</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.offerCount}</p>
              <p className="text-sm text-gray-500">активных скидок</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.redemptionCount}</p>
              <p className="text-sm text-gray-500">использований</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            Как это работает
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.step} className="text-center">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-bold text-gray-600 mb-3">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR Demo */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                QR-код вместо купонов
              </h2>
              <p className="text-gray-600 mb-6">
                Забудьте о бумажных купонах и промокодах. Клиент показывает QR-код на экране телефона — кассир сканирует камерой за 2 секунды.
              </p>
              <ul className="space-y-3">
                {[
                  'Без специального оборудования',
                  'Код обновляется каждые 30 секунд (защита от мошенничества)',
                  'Кассир видит название скидки и размер',
                  'Если камера не работает — 6-значный код вручную',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <QrCode className="w-32 h-32 text-gray-300 mx-auto mb-4" strokeWidth={1} />
              <p className="text-sm text-gray-500">Клиент показывает QR → кассир сканирует → скидка применена</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                ✓ -20% на кухню — подтверждено
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Templates */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3">
            Готовые шаблоны скидок
          </h2>
          <p className="text-gray-500 text-center mb-10 max-w-lg mx-auto">
            Выберите шаблон — заполните за 1 минуту. Или создайте своё уникальное предложение.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OFFER_TEMPLATES.map((tpl) => (
              <div key={tpl.name} className={`${tpl.color} border rounded-xl p-5 hover:shadow-md transition-shadow`}>
                <div className="text-2xl mb-2">{tpl.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{tpl.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{tpl.description}</p>
                <p className="text-xs font-medium text-gray-500">Пример: {tpl.example}</p>
              </div>
            ))}
            <Link
              href="/business/register"
              className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <span className="text-2xl mb-2">✨</span>
              <span className="font-bold text-gray-700 group-hover:text-blue-600">Своё предложение</span>
              <span className="text-xs text-gray-500 mt-1">Полная настройка</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            Почему ГдеСейчас
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Новые клиенты', desc: 'Пользователи находят вас через поиск, карту и рекомендации' },
              { icon: BarChart3, title: 'Аналитика', desc: 'Просмотры, активации, уникальные клиенты — всё в кабинете' },
              { icon: Clock, title: 'Гибкое расписание', desc: 'Скидки в непиковые часы? Только по будням? Настройте как хотите' },
              { icon: Shield, title: 'Защита от мошенничества', desc: 'QR-код обновляется каждые 30 сек, геолокация, лимиты' },
              { icon: Zap, title: 'Быстрый старт', desc: 'Регистрация за 3 минуты, первое предложение — за 1 минуту' },
              { icon: Star, title: 'Отзывы клиентов', desc: 'Клиенты оставляют отзывы после визита — растёт ваш рейтинг' },
            ].map((b) => (
              <div key={b.title} className="bg-white rounded-xl p-5 shadow-sm">
                <b.icon className="w-8 h-8 text-blue-600 mb-3" strokeWidth={1.5} />
                <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
                <p className="text-sm text-gray-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            Частые вопросы
          </h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details key={item.q} className="group bg-gray-50 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-medium text-gray-900 hover:bg-gray-100 transition-colors">
                  {item.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Начните получать клиентов сегодня
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Регистрация бесплатна. Первые клиенты — уже на этой неделе.
          </p>
          <Link
            href="/business/register"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-blue-50 active:scale-[0.98] transition-all shadow-lg"
          >
            Подключить заведение
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-blue-200 text-sm mt-4">
            Бесплатно · 3 минуты · Без специального оборудования
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
