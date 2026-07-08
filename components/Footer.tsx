import Link from 'next/link'
import { getLegalConfig } from '@/lib/legal'

export function Footer() {
  const legal = getLegalConfig()
  return (
    <footer className="border-t ec-line bg-[color:var(--ec-surface)] text-[color:var(--ec-muted)] py-10 px-4 pb-24 md:pb-10">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div>
          <h3 className="text-[color:var(--ec-text)] font-semibold text-lg mb-3">EchoCity</h3>
          <p className="text-sm leading-relaxed">
            Лучшие скидки в кафе, ресторанах и салонах вашего города
          </p>
          {legal.legalName && (
            <p className="text-xs ec-muted mt-3 leading-relaxed">
              {legal.legalName}
              {legal.inn && <span className="block">ИНН {legal.inn}</span>}
              {legal.ogrn && <span className="block">ОГРН {legal.ogrn}</span>}
            </p>
          )}
        </div>
        <div>
          <h4 className="text-[color:var(--ec-text)] font-semibold text-sm mb-3">Пользователям</h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/offers" className="hover:text-[color:var(--ec-text)] transition-colors">Все скидки</Link>
            <Link href="/map" className="hover:text-[color:var(--ec-text)] transition-colors">Карта</Link>
            <Link href="/subscription" className="hover:text-[color:var(--ec-text)] transition-colors">Подписка</Link>
          </div>
        </div>
        <div>
          <h4 className="text-[color:var(--ec-text)] font-semibold text-sm mb-3">Для бизнеса</h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/business/register" className="hover:text-[color:var(--ec-text)] transition-colors">Подключить заведение</Link>
            <Link href="/auth/login" className="hover:text-[color:var(--ec-text)] transition-colors">Войти в кабинет</Link>
          </div>
        </div>
        <div>
          <h4 className="text-[color:var(--ec-text)] font-semibold text-sm mb-3">Контакты</h4>
          <div className="flex flex-col gap-2 text-sm">
            {legal.address && <span>{legal.address}</span>}
            {legal.supportEmail && (
              <a href={`mailto:${legal.supportEmail}`} className="hover:text-[color:var(--ec-text)] transition-colors">
                {legal.supportEmail}
              </a>
            )}
            {legal.supportPhone && (
              <a href={`tel:${legal.supportPhone.replace(/\s/g, '')}`} className="hover:text-[color:var(--ec-text)] transition-colors">
                {legal.supportPhone}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t ec-line flex flex-col md:flex-row items-center justify-between gap-4 text-xs ec-muted">
        <span>&copy; {new Date().getFullYear()} EchoCity. Все права защищены.</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-[color:var(--ec-text)] transition-colors">Политика конфиденциальности</Link>
          <Link href="/terms" className="hover:text-[color:var(--ec-text)] transition-colors">Условия использования</Link>
        </div>
      </div>
    </footer>
  )
}
