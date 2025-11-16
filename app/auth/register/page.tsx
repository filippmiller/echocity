'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { getPasswordStrengthError } from '@/lib/password'
import YandexSignInButton from '@/components/YandexSignInButton'

type AccountType = 'CITIZEN' | 'BUSINESS_OWNER'

export default function RegisterPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<AccountType>('CITIZEN')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Common fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // CITIZEN fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Санкт-Петербург')
  const [language, setLanguage] = useState<'ru' | 'en'>('ru')


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

      if (accountType === 'CITIZEN') {
        payload.firstName = firstName
        payload.lastName = lastName || undefined
        payload.phone = phone || undefined
        payload.city = city || undefined
        payload.language = language || 'ru'
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
      if (data.user.role === 'CITIZEN') {
        router.push('/map')
      } else if (data.user.role === 'BUSINESS_OWNER') {
        router.push('/business/places')
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
                  value="CITIZEN"
                  checked={accountType === 'CITIZEN'}
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

            {accountType === 'CITIZEN' ? (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Имя *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Фамилия
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Телефон
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    Город
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Язык интерфейса
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="ru"
                        checked={language === 'ru'}
                        onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
                        className="mr-2"
                      />
                      Русский
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="en"
                        checked={language === 'en'}
                        onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
                        className="mr-2"
                      />
                      English
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                <p>Для регистрации бизнеса используйте <Link href="/business/register" className="underline font-medium">мастер регистрации</Link></p>
              </div>
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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">или</span>
              </div>
            </div>

            <div className="mt-6">
              <YandexSignInButton />
            </div>
          </div>

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

