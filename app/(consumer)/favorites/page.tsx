import { Heart } from 'lucide-react'
import Link from 'next/link'

export default function FavoritesPage() {
  return (
    <div className="px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Избранное</h1>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-9 h-9 text-pink-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Пока пусто</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-6">
            Нажимайте на сердечко на страницах заведений, чтобы сохранять их в избранное
          </p>
          <Link
            href="/offers"
            className="px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
          >
            Смотреть скидки
          </Link>
        </div>
      </div>
    </div>
  )
}
