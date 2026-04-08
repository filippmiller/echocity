import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 px-4 hidden md:block">
      <div className="max-w-6xl mx-auto grid grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-3">ГдеСейчас</h3>
          <p className="text-sm leading-relaxed">
            Лучшие скидки в кафе, ресторанах и салонах вашего города
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Пользователям</h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/offers" className="hover:text-white transition-colors">Все скидки</Link>
            <Link href="/map" className="hover:text-white transition-colors">Карта</Link>
            <Link href="/subscription" className="hover:text-white transition-colors">Подписка</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Для бизнеса</h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/business/register" className="hover:text-white transition-colors">Подключить заведение</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Войти в кабинет</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Контакты</h4>
          <div className="flex flex-col gap-2 text-sm">
            <span>Санкт-Петербург</span>
            <a href="mailto:info@gdesejchas.ru" className="hover:text-white transition-colors">info@gdesejchas.ru</a>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <span>&copy; {new Date().getFullYear()} ГдеСейчас. Все права защищены.</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-white transition-colors">Политика конфиденциальности</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Условия использования</Link>
        </div>
      </div>
    </footer>
  )
}
