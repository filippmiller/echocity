import { ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SatisfactionGuarantee } from '@/components/SatisfactionGuarantee'

export const metadata = {
  title: 'Гарантия удовлетворённости — ГдеСейчас',
  description:
    'Если заведение откажет принять вашу скидку — мы вернём стоимость подписки за месяц. Без вопросов.',
}

export default function GuaranteePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-deal-savings via-emerald-600 to-teal-700 text-white pt-6 pb-12 px-4 text-center relative">
        <Link
          href="/"
          className="absolute top-5 left-4 text-white/80 hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Link>

        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-9 h-9 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Гарантия удовлетворённости</h1>
        <p className="text-emerald-100 max-w-md mx-auto leading-relaxed">
          Мы стоим за каждую скидку. Если что-то пойдёт не так — вернём деньги.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-16 space-y-6">
        {/* Expanded guarantee component */}
        <SatisfactionGuarantee variant="expanded" />

        {/* How it works */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Как работает гарантия</h2>
          <ol className="space-y-4">
            {[
              {
                step: '1',
                title: 'Вы активируете скидку',
                desc: 'Нажимаете «Активировать» в приложении и показываете QR-код кассиру.',
              },
              {
                step: '2',
                title: 'Заведение отказывает',
                desc:
                  'Это случается редко, но если кассир отказал — не расстраивайтесь, мы разберёмся.',
              },
              {
                step: '3',
                title: 'Вы пишете в поддержку',
                desc:
                  'Откройте чат поддержки в приложении в течение 72 часов и опишите ситуацию.',
              },
              {
                step: '4',
                title: 'Мы возвращаем деньги',
                desc:
                  'В течение 24 часов возвращаем полную стоимость подписки за текущий месяц тем же способом оплаты.',
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <div className="w-8 h-8 bg-deal-savings/10 text-deal-savings rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* FAQ */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Часто задаваемые вопросы</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Распространяется ли гарантия на бесплатный план?',
                a: 'Гарантия удовлетворённости действует для подписчиков Plus и Premium. Пользователи бесплатного плана получают стандартную поддержку.',
              },
              {
                q: 'Что считается «отказом»?',
                a: 'Отказ — когда кассир или администратор не принял QR-код при соблюдении вами всех условий предложения: правильное время, тип заказа, минимальная сумма.',
              },
              {
                q: 'Сколько раз можно воспользоваться гарантией?',
                a: 'Не более одного раза в 30 дней для одного аккаунта. Это защищает сервис от злоупотреблений.',
              },
              {
                q: 'Что если я сам нарушил условия скидки?',
                a: 'Гарантия не распространяется на случаи, когда предложение было использовано не по условиям: например, вне временного окна или при заказе неподходящих позиций.',
              },
            ].map((item, i) => (
              <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <h3 className="font-semibold text-gray-900 text-sm">{item.q}</h3>
                <p className="text-sm text-gray-600 mt-1 leading-snug">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500">Ещё остались вопросы?</p>
          <Link
            href="/subscription"
            className="inline-block bg-deal-savings text-white px-8 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Оформить подписку с гарантией
          </Link>
        </div>
      </div>
    </div>
  )
}
