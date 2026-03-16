'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { getPasswordStrengthError } from '@/lib/password'
import YandexSignInButton from '@/components/YandexSignInButton'

type AccountType = 'CITIZEN' | 'BUSINESS_OWNER'

export default function RegisterPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<AccountType>('CITIZEN')
  const [loading, setLoading] = useState(false)

  // Common fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // CITIZEN fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Санкт-Петербург')
  const [language, setLanguage] = useState<'ru' | 'en'>('ru')

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordError(getPasswordStrengthError(newPassword))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password match
    if (password !== confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }

    // Validate password strength
    const passwordErrorMsg = getPasswordStrengthError(password)
    if (passwordErrorMsg) {
      setPasswordError(passwordErrorMsg)
      toast.error(passwordErrorMsg)
      return
    }

    setLoading(true)

    try {
      const payload: Record<string, unknown> = {
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
        toast.error(data.error || 'Ошибка при регистрации')
        return
      }

      toast.success('Аккаунт создан!')

      // Redirect based on role
      if (data.user.role === 'CITIZEN') {
        router.push('/map')
      } else if (data.user.role === 'BUSINESS_OWNER') {
        router.push('/business/places')
      } else {
        router.push('/admin')
      }
    } catch {
      toast.error('Ошибка при регистрации. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  const inputClassName = "block w-full px-4 py-3 border border-gray-200 rounded-xl text-base shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>
        <p className="mt-1 text-sm text-gray-500">
          Создайте аккаунт и начните экономить
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {/* Account type toggle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип аккаунта
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setAccountType('CITIZEN')}
              className={`py-2.5 px-3 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                accountType === 'CITIZEN'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Пользователь
            </button>
            <button
              type="button"
              onClick={() => setAccountType('BUSINESS_OWNER')}
              className={`py-2.5 px-3 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                accountType === 'BUSINESS_OWNER'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Бизнес
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className={inputClassName}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Пароль <span className="text-red-400">*</span>
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

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              Подтверждение пароля <span className="text-red-400">*</span>
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
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Имя <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Фамилия
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>

              {/* Phone & City row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Телефон
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7..."
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Город
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Язык интерфейса
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLanguage('ru')}
                    className={`py-2 px-3 text-sm font-medium rounded-lg transition-all min-h-[40px] ${
                      language === 'ru'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Русский
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`py-2 px-3 text-sm font-medium rounded-lg transition-all min-h-[40px] ${
                      language === 'en'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-brand-50 border border-brand-200 text-brand-700 px-4 py-3 rounded-xl text-sm">
              <p>
                Для регистрации бизнеса используйте{' '}
                <Link href="/business/register" className="underline font-semibold">
                  мастер регистрации
                </Link>
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60 disabled:pointer-events-none transition-all min-h-[48px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Регистрация...
              </>
            ) : (
              'Зарегистрироваться'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-gray-400">или</span>
          </div>
        </div>

        {/* Yandex */}
        <YandexSignInButton className="rounded-xl py-3 min-h-[48px] text-base" />
      </div>

      {/* Switch to login */}
      <p className="text-center text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <Link href="/auth/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
          Войти
        </Link>
      </p>
    </div>
  )
}
