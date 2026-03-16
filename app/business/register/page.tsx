'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { getPasswordStrengthError } from '@/lib/password'
import { toast } from 'sonner'

type Step = 1 | 2 | 3

const STEP_TITLES = ['Контактное лицо', 'Данные бизнеса', 'Первая точка']

export default function BusinessRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const [passwordError, setPasswordError] = useState<string | null>(null)

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
    if (step > 1) {
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

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Регистрация бизнеса
        </h1>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEP_TITLES.map((title, i) => {
              const stepNum = i + 1
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
                  <label className={labelClass}>Название бизнеса *</label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Юридическое название</label>
                  <input type="text" value={legalName} onChange={(e) => setLegalName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Тип бизнеса *</label>
                  <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} required className={inputClass}>
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
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Название точки *</label>
                  <input type="text" value={placeTitle} onChange={(e) => setPlaceTitle(e.target.value)} required className={inputClass} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Город *</label>
                    <input type="text" value={placeCity} onChange={(e) => setPlaceCity(e.target.value)} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Тип точки *</label>
                    <select value={placeType} onChange={(e) => setPlaceType(e.target.value)} required className={inputClass}>
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
                  <label className={labelClass}>Адрес *</label>
                  <input type="text" value={placeAddress} onChange={(e) => setPlaceAddress(e.target.value)} required className={inputClass} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Широта</label>
                    <input type="number" step="any" value={placeLat || ''} onChange={(e) => setPlaceLat(e.target.value ? parseFloat(e.target.value) : undefined)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Долгота</label>
                    <input type="number" step="any" value={placeLng || ''} onChange={(e) => setPlaceLng(e.target.value ? parseFloat(e.target.value) : undefined)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Телефон точки</label>
                    <input type="tel" value={placePhone} onChange={(e) => setPlacePhone(e.target.value)} className={inputClass} />
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
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Назад
                </button>
              ) : (
                <div />
              )}
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
      </div>
    </div>
  )
}
