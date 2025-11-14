'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { getPasswordStrengthError } from '@/lib/password'

type AccountType = 'USER' | 'BUSINESS_OWNER'

export default function RegisterPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<AccountType>('USER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Common fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // User fields
  const [fullName, setFullName] = useState('')
  const [homeCity, setHomeCity] = useState('Санкт-Петербург')
  const [preferredLanguage, setPreferredLanguage] = useState('ru')

  // Business fields
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [placeCategory, setPlaceCategory] = useState('CAFE')
  const [placeDescription, setPlaceDescription] = useState('')
  const [placeCity, setPlaceCity] = useState('Санкт-Петербург')
  const [placeAddress, setPlaceAddress] = useState('')
  const [placePhone, setPlacePhone] = useState('')

  const [passwordError, setPasswordError] = useState<string | null>(null)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordError(getPasswordStrengthError(newPassword))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate password match
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    // Validate password strength
    const passwordErrorMsg = getPasswordStrengthError(password)
    if (passwordErrorMsg) {
      setPasswordError(passwordErrorMsg)
      setError(passwordErrorMsg)
      return
    }

    setLoading(true)

    try {
      const payload: any = {
        accountType,
        email,
        password,
      }

      if (accountType === 'USER') {
        payload.fullName = fullName || undefined
        payload.homeCity = homeCity || undefined
        payload.preferredLanguage = preferredLanguage || 'ru'
      } else {
        payload.contactName = contactName
        payload.contactPhone = contactPhone
        payload.displayName = displayName
        payload.legalName = legalName || undefined
        payload.contactEmail = contactEmail
        payload.placeName = placeName
        payload.placeCategory = placeCategory
        payload.placeDescription = placeDescription || undefined
        payload.placeCity = placeCity
        payload.placeAddress = placeAddress
        payload.placePhone = placePhone
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка при регистрации')
        return
      }

      // Redirect based on role
      if (data.user.role === 'USER') {
        router.push('/dashboard')
      } else if (data.user.role === 'BUSINESS_OWNER') {
        router.push('/business/dashboard')
      } else {
        router.push('/admin')
      }
    } catch (err) {
      setError('Ошибка при регистрации. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Регистрация
          </h2>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {/* Account type selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип аккаунта
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="USER"
                  checked={accountType === 'USER'}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="mr-2"
                />
                Я пользователь
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="BUSINESS_OWNER"
                  checked={accountType === 'BUSINESS_OWNER'}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="mr-2"
                />
                Я представляю бизнес
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common fields */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Пароль *
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={handlePasswordChange}
                error={passwordError || undefined}
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Подтверждение пароля *
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                error={password !== confirmPassword && confirmPassword ? 'Пароли не совпадают' : undefined}
                required
              />
            </div>

            {accountType === 'USER' ? (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Имя
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="homeCity" className="block text-sm font-medium text-gray-700">
                    Город
                  </label>
                  <input
                    id="homeCity"
                    type="text"
                    value={homeCity}
                    onChange={(e) => setHomeCity(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                    Имя контактного лица *
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                    Телефон контактного лица *
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                    Название бизнеса *
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="legalName" className="block text-sm font-medium text-gray-700">
                    Юридическое название
                  </label>
                  <input
                    id="legalName"
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                    Email для клиентов *
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="placeName" className="block text-sm font-medium text-gray-700">
                    Название точки *
                  </label>
                  <input
                    id="placeName"
                    type="text"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="placeCategory" className="block text-sm font-medium text-gray-700">
                    Категория *
                  </label>
                  <select
                    id="placeCategory"
                    value={placeCategory}
                    onChange={(e) => setPlaceCategory(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="CAFE">Кафе</option>
                    <option value="BAR">Бар</option>
                    <option value="RESTAURANT">Ресторан</option>
                    <option value="NAIL_SALON">Маникюр</option>
                    <option value="HAIRDRESSER">Парикмахерская</option>
                    <option value="BARBERSHOP">Барбершоп</option>
                    <option value="DRY_CLEANING">Химчистка</option>
                    <option value="OTHER_SERVICE">Другое</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="placeDescription" className="block text-sm font-medium text-gray-700">
                    Описание
                  </label>
                  <textarea
                    id="placeDescription"
                    value={placeDescription}
                    onChange={(e) => setPlaceDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="placeCity" className="block text-sm font-medium text-gray-700">
                    Город *
                  </label>
                  <input
                    id="placeCity"
                    type="text"
                    value={placeCity}
                    onChange={(e) => setPlaceCity(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="placeAddress" className="block text-sm font-medium text-gray-700">
                    Адрес *
                  </label>
                  <input
                    id="placeAddress"
                    type="text"
                    value={placeAddress}
                    onChange={(e) => setPlaceAddress(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="placePhone" className="block text-sm font-medium text-gray-700">
                    Телефон точки *
                  </label>
                  <input
                    id="placePhone"
                    type="tel"
                    value={placePhone}
                    onChange={(e) => setPlacePhone(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

