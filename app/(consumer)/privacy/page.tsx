import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — ГдеСейчас',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Политика конфиденциальности</h1>
        <p className="text-sm text-gray-500 mb-8">Дата вступления в силу: 1 апреля 2026 г.</p>

        <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Общие положения</h2>
            <p>
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных
              пользователей сервиса ГдеСейчас (далее — Сервис), доступного по адресу echocity.vsedomatut.com.
            </p>
            <p>
              Обработка персональных данных осуществляется в соответствии с Федеральным законом от 27.07.2006
              N 152-ФЗ «О персональных данных».
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Какие данные мы собираем</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Адрес электронной почты — для регистрации и входа в аккаунт</li>
              <li>Номер телефона — для авторизации по SMS (при использовании)</li>
              <li>Имя и фамилия — для персонализации</li>
              <li>Город — для отображения релевантных предложений</li>
              <li>Данные об использовании скидок — для формирования статистики экономии</li>
              <li>Геолокация — только с вашего согласия, для поиска ближайших предложений</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Цели обработки данных</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Предоставление доступа к функциям Сервиса</li>
              <li>Персонализация предложений и рекомендаций</li>
              <li>Обеспечение безопасности аккаунта</li>
              <li>Улучшение качества Сервиса</li>
              <li>Выполнение обязательств перед пользователями</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Защита данных</h2>
            <p>
              Мы применяем организационные и технические меры для защиты персональных данных от
              несанкционированного доступа, изменения, раскрытия или уничтожения. Пароли хранятся
              в хешированном виде. Передача данных осуществляется по защищённому протоколу HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Передача данных третьим лицам</h2>
            <p>
              Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением случаев,
              предусмотренных законодательством Российской Федерации.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Права пользователя</h2>
            <p>
              Вы имеете право на доступ, исправление и удаление своих персональных данных.
              Для реализации этих прав обратитесь по адресу: info@gdesejchas.ru.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. Cookies</h2>
            <p>
              Сервис использует cookies для обеспечения работы сессий авторизации.
              Аналитические cookies не используются без вашего согласия.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">8. Контакты</h2>
            <p>
              По вопросам, связанным с обработкой персональных данных, обращайтесь: info@gdesejchas.ru
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
