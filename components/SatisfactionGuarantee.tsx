'use client'

import { useState } from 'react'
import { ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface Props {
  variant?: 'compact' | 'expanded'
}

export function SatisfactionGuarantee({ variant = 'compact' }: Props) {
  const [termsOpen, setTermsOpen] = useState(false)

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 bg-deal-savings/8 border border-deal-savings/20 rounded-xl px-4 py-3">
        <ShieldCheck className="w-5 h-5 text-deal-savings shrink-0" strokeWidth={1.75} />
        <p className="text-sm text-gray-700 leading-snug">
          <span className="font-semibold text-deal-savings">Гарантия работы скидки</span>
          {' '}— если заведение откажет, мы вернём стоимость подписки за месяц.{' '}
          <Link href="/guarantee" className="underline text-deal-savings hover:opacity-80 transition-opacity">
            Подробнее
          </Link>
        </p>
      </div>
    )
  }

  // expanded variant
  return (
    <div className="bg-white border border-deal-savings/30 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-deal-savings/8 px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-deal-savings rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-base">Гарантия удовлетворённости</h3>
          <p className="text-sm text-deal-savings font-medium">Ваши деньги защищены</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-gray-700 leading-relaxed">
          Если заведение откажет принять вашу скидку по нашему QR-коду — мы вернём полную стоимость
          подписки за текущий месяц. Без вопросов, без долгих разбирательств.
        </p>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { emoji: '🛡️', label: '100%', sub: 'защита' },
            { emoji: '⚡', label: '24 ч', sub: 'возврат' },
            { emoji: '📞', label: '0 руб', sub: 'за поддержку' },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl py-3">
              <div className="text-xl mb-1">{item.emoji}</div>
              <div className="font-bold text-gray-900 text-sm">{item.label}</div>
              <div className="text-xs text-gray-500">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Expandable terms */}
        <button
          onClick={() => setTermsOpen((o) => !o)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors text-btn w-full"
        >
          {termsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {termsOpen ? 'Скрыть условия' : 'Показать условия гарантии'}
        </button>

        {termsOpen && (
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2 leading-relaxed">
            <p className="font-semibold text-gray-800">Условия гарантии:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Гарантия распространяется на активных подписчиков Plus и Premium.</li>
              <li>
                Возврат производится, если заведение отказало принять QR-код при соблюдении всех
                условий предложения (время, тип заказа и т.д.).
              </li>
              <li>Обращение необходимо подать в течение 72 часов после отказа через поддержку в приложении.</li>
              <li>Не более одного возврата в течение 30 дней для одного аккаунта.</li>
              <li>Возврат осуществляется тем же способом, которым была произведена оплата, в течение 24 часов.</li>
            </ul>
            <p className="text-gray-500 text-xs pt-1">
              Вопросы? Напишите нам в поддержку — ответим в течение часа.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
