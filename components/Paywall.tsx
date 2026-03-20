'use client'

import Link from 'next/link'
import { SatisfactionGuarantee } from '@/components/SatisfactionGuarantee'

export function Paywall() {
  return (
    <div className="bg-gradient-to-b from-purple-50 to-white border border-purple-200 rounded-xl p-6 text-center">
      <div className="text-3xl mb-2">*</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Для подписчиков Plus</h3>
      <p className="text-sm text-gray-600 mb-4">
        Получите доступ к эксклюзивным предложениям от лучших заведений города
      </p>
      <ul className="text-sm text-gray-700 mb-4 space-y-1">
        <li>Безлимитные предложения</li>
        <li>Эксклюзивные скидки</li>
        <li>7 дней бесплатно</li>
      </ul>
      <Link
        href="/subscription"
        className="inline-block bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700"
      >
        Подписаться от 199{'\u20BD'}/мес
      </Link>

      <div className="mt-4 text-left">
        <SatisfactionGuarantee variant="compact" />
      </div>
    </div>
  )
}
