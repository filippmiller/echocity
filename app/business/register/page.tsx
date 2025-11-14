'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { getPasswordStrengthError } from '@/lib/password'

type Step = 1 | 2 | 3

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

      router.push('/business/places')
    } catch (err) {
      setError('Ошибка при регистрации. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            Регистрация бизнеса
          </h2>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div
                className={`flex items-center ${
                  step >= 1 ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Контактное лицо</span>
              </div>
              <div className="flex-1 h-1 mx-4 bg-gray-200">
                <div
                  className={`h-1 ${
                    step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  style={{ width: step >= 2 ? '100%' : '0%' }}
                />
              </div>
              <div
                className={`flex items-center ${
                  step >= 2 ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Данные бизнеса</span>
              </div>
              <div className="flex-1 h-1 mx-4 bg-gray-200">
                <div
                  className={`h-1 ${
                    step >= 3 ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  style={{ width: step >= 3 ? '100%' : '0%' }}
                />
              </div>
              <div
                className={`flex items-center ${
                  step >= 3 ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Первая точка</span>
              </div>
            </div>
          </div>

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Шаг 1: Контактное лицо</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Пароль *
                  </label>
                  <PasswordInput
                    value={password}
                    onChange={handlePasswordChange}
                    error={passwordError || undefined}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Подтверждение пароля *
                  </label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите пароль"
                    error={password !== confirmPassword && confirmPassword ? 'Пароли не совпадают' : undefined}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Имя *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Фамилия
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Шаг 2: Данные бизнеса</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Название бизнеса *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Юридическое название
                  </label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Тип бизнеса *
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <label className="block text-sm font-medium text-gray-700">
                    Описание
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Сайт
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email для клиентов
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Телефон для клиентов
                  </label>
                  <input
                    type="tel"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      VK
                    </label>
                    <input
                      type="text"
                      value={vk}
                      onChange={(e) => setVk(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Telegram
                    </label>
                    <input
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Шаг 3: Первая точка</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Название точки *
                  </label>
                  <input
                    type="text"
                    value={placeTitle}
                    onChange={(e) => setPlaceTitle(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Город *
                    </label>
                    <input
                      type="text"
                      value={placeCity}
                      onChange={(e) => setPlaceCity(e.target.value)}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Тип точки *
                    </label>
                    <select
                      value={placeType}
                      onChange={(e) => setPlaceType(e.target.value)}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <label className="block text-sm font-medium text-gray-700">
                    Адрес *
                  </label>
                  <input
                    type="text"
                    value={placeAddress}
                    onChange={(e) => setPlaceAddress(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Широта (lat)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={placeLat || ''}
                      onChange={(e) =>
                        setPlaceLat(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Долгота (lng)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={placeLng || ''}
                      onChange={(e) =>
                        setPlaceLng(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Телефон точки
                    </label>
                    <input
                      type="tel"
                      value={placePhone}
                      onChange={(e) => setPlacePhone(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Особенности
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hasWorkspace}
                        onChange={(e) => setHasWorkspace(e.target.checked)}
                        className="mr-2"
                      />
                      Есть места для работы с ноутбуком
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hasWifi}
                        onChange={(e) => setHasWifi(e.target.checked)}
                        className="mr-2"
                      />
                      Есть Wi-Fi
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hasSockets}
                        onChange={(e) => setHasSockets(e.target.checked)}
                        className="mr-2"
                      />
                      Есть розетки
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSpecialtyCoffee}
                        onChange={(e) => setIsSpecialtyCoffee(e.target.checked)}
                        className="mr-2"
                      />
                      Specialty кофе
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hasParking}
                        onChange={(e) => setHasParking(e.target.checked)}
                        className="mr-2"
                      />
                      Есть парковка
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isKidsFriendly}
                        onChange={(e) => setIsKidsFriendly(e.target.checked)}
                        className="mr-2"
                      />
                      Детская зона
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Средний чек (₽)
                  </label>
                  <input
                    type="number"
                    value={averageCheck}
                    onChange={(e) => setAverageCheck(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Назад
                </button>
              )}
              <div className="ml-auto">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Далее
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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

