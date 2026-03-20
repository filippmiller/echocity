'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { getPasswordStrengthError } from '@/lib/password'
import { toast } from 'sonner'
import { YandexAutoFill, YandexAutoFillData } from '@/components/YandexAutoFill'
import { MapPin } from 'lucide-react'

// Step 0 = Yandex autofill, Steps 1-3 = original steps
type Step = 0 | 1 | 2 | 3

const STEP_TITLES = ['Контактное лицо', 'Данные бизнеса', 'Первая точка']

// Category-specific offer templates shown after autofill
const OFFER_TEMPLATES: Record<string, { title: string; hint: string }[]> = {
  CAFE: [
    { title: 'Скидка 15% в обеденное время', hint: 'Пн–Пт, 12:00–15:00' },
    { title: 'Третий кофе в подарок', hint: 'Действует весь день' },
  ],
  RESTAURANT: [
    { title: 'Скидка 20% на кухню Пн-Чт', hint: 'Не распространяется на алкоголь' },
    { title: 'Бизнес-ланч со скидкой 25%', hint: 'Пн–Пт, 12:00–16:00' },
  ],
  BAR: [
    { title: 'Скидка на коктейли до 19:00', hint: 'Happy hour, все коктейли -30%' },
    { title: 'Второй напиток в подарок', hint: 'Пт и Сб, после 21:00' },
  ],
  BEAUTY: [
    { title: 'Скидка 10% на первый визит', hint: 'Для новых клиентов' },
    { title: 'Комплексный уход -20%', hint: 'При записи онлайн' },
  ],
  NAILS: [
    { title: 'Маникюр + покрытие со скидкой 15%', hint: 'Для новых клиентов' },
    { title: 'Скидка 20% при записи онлайн', hint: 'Все виды услуг' },
  ],
  HAIR: [
    { title: 'Стрижка + укладка -15%', hint: 'Пн–Ср, для новых клиентов' },
    { title: 'Окрашивание со скидкой 20%', hint: 'По предварительной записи' },
  ],
  DRYCLEANING: [
    { title: 'Скидка 10% на первый заказ', hint: 'Для новых клиентов' },
    { title: 'Экспресс-чистка -15%', hint: 'Срок исполнения — 24 часа' },
  ],
  OTHER: [
    { title: 'Скидка 10% для новых клиентов', hint: 'По промокоду' },
  ],
}

export default function BusinessRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yandexFilled, setYandexFilled] = useState(false)

  // Step 1: Contact person
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2: Business data
  const [businessName, setBusinessName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [businessType, setBusinessType] = useState('CAFE')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [vk, setVk] = useState('')
  const [telegram, setTelegram] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [supportPhone, setSupportPhone] = useState('')

  // Step 3: First place
  const [placeTitle, setPlaceTitle] = useState('')
  const [placeCity, setPlaceCity] = useState('Санкт-Петербург')
  const [placeAddress, setPlaceAddress] = useState('')
  const [placeLat, setPlaceLat] = useState<number>()
  const [placeLng, setPlaceLng] = useState<number>()
  const [placePhone, setPlacePhone] = useState('')
  const [placeType, setPlaceType] = useState('CAFE')
  const [hasWorkspace, setHasWorkspace] = useState(false)
  const [hasWifi, setHasWifi] = useState(false)
  const [hasSockets, setHasSockets] = useState(false)
  const [isSpecialtyCoffee, setIsSpecialtyCoffee] = useState(false)
  const [hasParking, setHasParking] = useState(false)
  const [isKidsFriendly, setIsKidsFriendly] = useState(false)
  const [averageCheck, setAverageCheck] = useState('')

  // Autofill-specific tracking (which fields came from Yandex)
  const [yandexFilledFields, setYandexFilledFields] = useState<Set<string>>(new Set())

  const [passwordError, setPasswordError] = useState<string | null>(null)

  // ─── Yandex AutoFill handlers ────────────────────────────────────────────

  const handleYandexSelect = (data: YandexAutoFillData) => {
    const filled = new Set<string>()

    // Pre-fill Step 2: business
    if (data.name) {
      setBusinessName(data.name)
      filled.add('businessName')
    }
    if (data.businessType) {
      setBusinessType(data.businessType)
      filled.add('businessType')
    }

    // Pre-fill Step 3: place
    if (data.name) {
      setPlaceTitle(data.name)
      filled.add('placeTitle')
    }
    if (data.address) {
      setPlaceAddress(data.address)
      filled.add('placeAddress')

      // Extract city from address (first segment before comma)
      const city = data.address.split(',')[0]?.trim()
      if (city && city.length < 50) {
        setPlaceCity(city)
        filled.add('placeCity')
      }
    }
    if (data.phone) {
      setPlacePhone(data.phone)
      filled.add('placePhone')
    }
    if (data.lat !== undefined) {
      setPlaceLat(data.lat)
      filled.add('placeLat')
    }
    if (data.lng !== undefined) {
      setPlaceLng(data.lng)
      filled.add('placeLng')
    }
    if (data.businessType) {
      setPlaceType(data.businessType)
      filled.add('placeType')
    }

    setYandexFilledFields(filled)
    setYandexFilled(true)

    // Jump to step 1 (contact), with step 2 pre-filled
    setStep(1)

    toast.success('Данные заведения заполнены из Яндекс Карт')
  }

  const handleYandexSkip = () => {
    setYandexFilled(false)
    setYandexFilledFields(new Set())
    setStep(1)
  }

  // ─── Form helpers ─────────────────────────────────────────────────────────

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordError(getPasswordStrengthError(newPassword))
  }

  const validateStep1 = () => {
    if (!email || !password || !firstName || !phone) {
      setError('Заполните все обязательные поля')
      return false
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return false
    }
    if (getPasswordStrengthError(password)) {
      setError(getPasswordStrengthError(password) || 'Пароль слишком слабый')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!businessName || !businessType) {
      setError('Заполните все обязательные поля')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!placeTitle || !placeCity || !placeAddress || !placeType) {
      setError('Заполните все обязательные поля')
      return false
    }
    return true
  }

  const handleNext = () => {
    setError(null)
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    setError(null)
    if (step === 1) {
      setStep(0)
    } else if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateStep3()) return

    setLoading(true)

    try {
      const payload: any = {
        email,
        password,
        firstName,
        lastName: lastName || undefined,
        phone,
        businessName,
        legalName: legalName || undefined,
        businessType,
        description: description || undefined,
        website: website || undefined,
        instagram: instagram || undefined,
        vk: vk || undefined,
        telegram: telegram || undefined,
        supportEmail: supportEmail || undefined,
        supportPhone: supportPhone || undefined,
        placeTitle,
        placeCity,
        placeAddress,
        placeLat: placeLat || undefined,
        placeLng: placeLng || undefined,
        placePhone: placePhone || undefined,
        placeType,
        hasWorkspace,
        hasWifi,
        hasSockets,
        isSpecialtyCoffee,
        hasParking,
        isKidsFriendly,
        averageCheck: averageCheck ? parseInt(averageCheck) : undefined,
      }

      const response = await fetch('/api/business/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка при регистрации')
        return
      }

      toast.success('Бизнес успешно зарегистрирован!')
      router.push('/business/places')
    } catch (err) {
      setError('Ошибка при регистрации. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow'
  const labelClass = 'block text-sm font-medium text-gray-700'

  // Yandex-filled badge
  const YandexBadge = () => (
    <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-50 text-brand-600 border border-brand-200">
      <MapPin className="w-2.5 h-2.5" />
      Яндекс Карты
    </span>
  )

  const filledInputClass = (field: string) =>
    `mt-1 block w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow ${
      yandexFilledFields.has(field)
        ? 'border-brand-300 bg-brand-50/50'
        : 'border-gray-200'
    }`

  // Offer templates for the current business type
  const templates = OFFER_TEMPLATES[placeType] || OFFER_TEMPLATES.OTHER

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Регистрация бизнеса
        </h1>

        {/* Step 0: Yandex AutoFill */}
        {step === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <YandexAutoFill onSelect={handleYandexSelect} onSkip={handleYandexSkip} />
          </div>
        )}

        {/* Steps 1-3: Main form */}
        {step > 0 && (
          <>
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {STEP_TITLES.map((title, i) => {
                  const stepNum = (i + 1) as 1 | 2 | 3
                  const isCompleted = step > stepNum
                  const isCurrent = step === stepNum

                  return (
                    <div key={stepNum} className="flex items-center">
                      {i > 0 && (
                        <div className={`hidden sm:block w-12 md:w-20 h-0.5 mx-2 ${step > i ? 'bg-brand-600' : 'bg-gray-200'}`} />
                      )}
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 transition-colors ${
                            isCompleted || isCurrent
                              ? 'bg-brand-600 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            stepNum
                          )}
                        </div>
                        <span className={`hidden sm:inline text-sm font-medium ${isCurrent ? 'text-brand-600' : 'text-gray-400'}`}>
                          {title}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Mobile step label */}
              <p className="sm:hidden text-center text-sm font-medium text-brand-600 mt-3">
                Шаг {step}: {STEP_TITLES[step - 1]}
              </p>
              {/* Yandex-filled notice */}
              {yandexFilled && (
                <div className="mt-3 flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 px-3 py-2 rounded-lg text-xs">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>Данные заведения загружены из Яндекс Карт и предзаполнены на шаге 2 и 3</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext() }} className="space-y-5">
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Email *</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Пароль *</label>
                      <PasswordInput
                        value={password}
                        onChange={handlePasswordChange}
                        error={passwordError || undefined}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Подтверждение пароля *</label>
                      <PasswordInput
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Повторите пароль"
                        error={password !== confirmPassword && confirmPassword ? 'Пароли не совпадают' : undefined}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Имя *</label>
                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Фамилия</label>
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Телефон *</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputClass} />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>
                        Название бизнеса *
                        {yandexFilledFields.has('businessName') && <YandexBadge />}
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                        className={filledInputClass('businessName')}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Юридическое название</label>
                      <input type="text" value={legalName} onChange={(e) => setLegalName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Тип бизнеса *
                        {yandexFilledFields.has('businessType') && <YandexBadge />}
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        required
                        className={filledInputClass('businessType')}
                      >
                        <option value="CAFE">Кафе</option>
                        <option value="RESTAURANT">Ресторан</option>
                        <option value="BAR">Бар</option>
                        <option value="BEAUTY">Красота</option>
                        <option value="NAILS">Маникюр</option>
                        <option value="HAIR">Парикмахерская</option>
                        <option value="DRYCLEANING">Химчистка</option>
                        <option value="OTHER">Другое</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Описание</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Сайт</label>
                        <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Email для клиентов</label>
                        <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Телефон для клиентов</label>
                      <input type="tel" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Instagram</label>
                        <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>VK</label>
                        <input type="text" value={vk} onChange={(e) => setVk(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Telegram</label>
                        <input type="text" value={telegram} onChange={(e) => setTelegram(e.target.value)} className={inputClass} />
                      </div>
                    </div>

                    {/* Offer templates after autofill */}
                    {yandexFilled && templates.length > 0 && (
                      <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-sm font-medium text-amber-800 mb-3">
                          Популярные шаблоны для вашей категории
                        </p>
                        <div className="space-y-2">
                          {templates.map((tpl) => (
                            <div
                              key={tpl.title}
                              className="flex items-start gap-2 p-2.5 bg-white border border-amber-200 rounded-lg"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900">{tpl.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{tpl.hint}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          После регистрации вы сможете создать предложение на основе этих шаблонов
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>
                        Название точки *
                        {yandexFilledFields.has('placeTitle') && <YandexBadge />}
                      </label>
                      <input
                        type="text"
                        value={placeTitle}
                        onChange={(e) => setPlaceTitle(e.target.value)}
                        required
                        className={filledInputClass('placeTitle')}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>
                          Город *
                          {yandexFilledFields.has('placeCity') && <YandexBadge />}
                        </label>
                        <input
                          type="text"
                          value={placeCity}
                          onChange={(e) => setPlaceCity(e.target.value)}
                          required
                          className={filledInputClass('placeCity')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Тип точки *
                          {yandexFilledFields.has('placeType') && <YandexBadge />}
                        </label>
                        <select
                          value={placeType}
                          onChange={(e) => setPlaceType(e.target.value)}
                          required
                          className={filledInputClass('placeType')}
                        >
                          <option value="CAFE">Кафе</option>
                          <option value="RESTAURANT">Ресторан</option>
                          <option value="BAR">Бар</option>
                          <option value="BEAUTY">Красота</option>
                          <option value="NAILS">Маникюр</option>
                          <option value="HAIR">Парикмахерская</option>
                          <option value="DRYCLEANING">Химчистка</option>
                          <option value="OTHER">Другое</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>
                        Адрес *
                        {yandexFilledFields.has('placeAddress') && <YandexBadge />}
                      </label>
                      <input
                        type="text"
                        value={placeAddress}
                        onChange={(e) => setPlaceAddress(e.target.value)}
                        required
                        className={filledInputClass('placeAddress')}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>
                          Широта
                          {yandexFilledFields.has('placeLat') && <YandexBadge />}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={placeLat || ''}
                          onChange={(e) => setPlaceLat(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className={filledInputClass('placeLat')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Долгота
                          {yandexFilledFields.has('placeLng') && <YandexBadge />}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={placeLng || ''}
                          onChange={(e) => setPlaceLng(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className={filledInputClass('placeLng')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Телефон точки
                          {yandexFilledFields.has('placePhone') && <YandexBadge />}
                        </label>
                        <input
                          type="tel"
                          value={placePhone}
                          onChange={(e) => setPlacePhone(e.target.value)}
                          className={filledInputClass('placePhone')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`${labelClass} mb-3`}>Особенности</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { checked: hasWorkspace, set: setHasWorkspace, label: 'Места для работы с ноутбуком' },
                          { checked: hasWifi, set: setHasWifi, label: 'Wi-Fi' },
                          { checked: hasSockets, set: setHasSockets, label: 'Розетки' },
                          { checked: isSpecialtyCoffee, set: setIsSpecialtyCoffee, label: 'Specialty кофе' },
                          { checked: hasParking, set: setHasParking, label: 'Парковка' },
                          { checked: isKidsFriendly, set: setIsKidsFriendly, label: 'Детская зона' },
                        ].map((feat) => (
                          <label
                            key={feat.label}
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={feat.checked}
                              onChange={(e) => feat.set(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-sm text-gray-700">{feat.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Средний чек (&#8381;)</label>
                      <input type="number" value={averageCheck} onChange={(e) => setAverageCheck(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Назад
                  </button>
                  <div>
                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                      >
                        Далее
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Регистрация...' : 'Зарегистрировать'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
