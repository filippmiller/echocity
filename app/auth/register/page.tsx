'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, Phone, Mail } from 'lucide-react'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { getPasswordStrengthError } from '@/lib/password'
import YandexSignInButton from '@/components/YandexSignInButton'

type AccountType = 'CITIZEN' | 'BUSINESS_OWNER'
type RegisterTab = 'phone' | 'email'

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const stripped = digits.startsWith('7') ? digits.slice(1) : digits.startsWith('8') ? digits.slice(1) : digits
  const d = stripped.slice(0, 10)
  if (d.length === 0) return ''
  let result = '+7'
  if (d.length > 0) result += ' ' + d.slice(0, 3)
  if (d.length > 3) result += ' ' + d.slice(3, 6)
  if (d.length > 6) result += ' ' + d.slice(6, 8)
  if (d.length > 8) result += ' ' + d.slice(8, 10)
  return result
}

function toApiPhone(formatted: string): string {
  return '+7' + formatted.replace(/\D/g, '').slice(1)
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  const [activeTab, setActiveTab] = useState<RegisterTab>('phone')
  const [accountType, setAccountType] = useState<AccountType>('CITIZEN')
  const [loading, setLoading] = useState(false)

  // Email tab fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Санкт-Петербург')
  const [language, setLanguage] = useState<'ru' | 'en'>('ru')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])

  // Phone tab state
  const [phoneDisplay, setPhoneDisplay] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [code, setCode] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    fetch('/api/public/cities')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCities(data)
        else if (data.cities) setCities(data.cities)
      })
      .catch(() => {})
  }, [])

  const redirectAfterLogin = (role: string) => {
    if (redirectTo) {
      router.push(redirectTo)
    } else if (role === 'CITIZEN') {
      router.push('/map')
    } else if (role === 'BUSINESS_OWNER') {
      router.push('/business/places')
    } else {
      router.push('/admin')
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordError(getPasswordStrengthError(newPassword))
  }

  // ---- Email registration ----
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!termsAccepted) {
      toast.error('Необходимо принять условия использования')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }

    const passwordErrorMsg = getPasswordStrengthError(password)
    if (passwordErrorMsg) {
      setPasswordError(passwordErrorMsg)
      toast.error(passwordErrorMsg)
      return
    }

    setLoading(true)

    try {
      const payload: Record<string, unknown> = { accountType, email, password }

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
      redirectAfterLogin(data.user.role)
    } catch {
      toast.error('Ошибка при регистрации. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  // ---- Phone OTP flow ----
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneDisplay(formatPhone(e.target.value))
  }

  const handleSendOtp = async () => {
    const apiPhone = toApiPhone(phoneDisplay)
    if (!/^\+7\d{10}$/.test(apiPhone)) {
      toast.error('Введите корректный номер телефона в формате +7XXXXXXXXXX')
      return
    }
    setPhoneLoading(true)
    try {
      const response = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: apiPhone }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Ошибка при отправке кода')
        return
      }
      setOtpSent(true)
      setCooldown(60)
      toast.success('Код отправлен')
    } catch {
      toast.error('Ошибка при отправке кода. Попробуйте позже.')
    } finally {
      setPhoneLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const apiPhone = toApiPhone(phoneDisplay)
    if (code.length !== 4) {
      toast.error('Введите 4-значный код')
      return
    }
    setPhoneLoading(true)
    try {
      const response = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: apiPhone, code }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Неверный код')
        return
      }
      toast.success('Аккаунт создан!')
      redirectAfterLogin(data.user.role)
    } catch {
      toast.error('Ошибка при проверке кода. Попробуйте позже.')
    } finally {
      setPhoneLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (cooldown > 0) return
    setCode('')
    await handleSendOtp()
  }

  const inputClassName =
    'block w-full px-4 py-3 border border-gray-200 rounded-xl text-base shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow'

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>
        <p className="mt-1 text-sm text-gray-500">Создайте аккаунт и начните экономить</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {/* Method tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('phone')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
              activeTab === 'phone'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Phone className="w-4 h-4" />
            Телефон
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
              activeTab === 'email'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        </div>

        {/* ======= PHONE TAB ======= */}
        {activeTab === 'phone' && (
          <div className="space-y-5">
            <div className="bg-brand-50 border border-brand-200 text-brand-700 px-4 py-3 rounded-xl text-sm">
              Введите номер телефона — мы отправим код для быстрой регистрации без пароля
            </div>

            <div>
              <label htmlFor="regPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Номер телефона
              </label>
              <input
                id="regPhone"
                type="tel"
                value={phoneDisplay}
                onChange={handlePhoneInput}
                placeholder="+7 900 000 00 00"
                autoComplete="tel"
                disabled={otpSent}
                className={`${inputClassName} ${otpSent ? 'bg-gray-50 text-gray-400' : ''}`}
              />
            </div>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={phoneLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60 disabled:pointer-events-none transition-all min-h-[48px]"
              >
                {phoneLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Получить код'
                )}
              </button>
            ) : (
              <>
                <div>
                  <label htmlFor="regCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Код из SMS
                  </label>
                  <input
                    id="regCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="0000"
                    autoComplete="one-time-code"
                    className={`${inputClassName} text-center tracking-[0.5em] text-xl font-bold`}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={phoneLoading || code.length !== 4}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60 disabled:pointer-events-none transition-all min-h-[48px]"
                >
                  {phoneLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Проверка...
                    </>
                  ) : (
                    'Зарегистрироваться'
                  )}
                </button>

                <p className="text-center text-sm text-gray-500">
                  {cooldown > 0 ? (
                    <>Отправить снова через {cooldown} с</>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      Отправить снова
                    </button>
                  )}
                </p>
              </>
            )}
          </div>
        )}

        {/* ======= EMAIL TAB ======= */}
        {activeTab === 'email' && (
          <>
            {/* Account type toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Тип аккаунта</label>
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

            <form onSubmit={handleEmailSubmit} className="space-y-5">
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
                  error={
                    password !== confirmPassword && confirmPassword ? 'Пароли не совпадают' : undefined
                  }
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
                      <select
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={inputClassName}
                      >
                        <option value="Санкт-Петербург">Санкт-Петербург</option>
                        {cities
                          .filter((c) => c.name !== 'Санкт-Петербург')
                          .map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                      </select>
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

              {/* Terms acceptance */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600">
                  Я принимаю{' '}
                  <Link href="/terms" target="_blank" className="text-brand-600 hover:underline">
                    Условия использования
                  </Link>{' '}
                  и{' '}
                  <Link href="/privacy" target="_blank" className="text-brand-600 hover:underline">
                    Политику конфиденциальности
                  </Link>
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !termsAccepted}
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
          </>
        )}

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
        <Link
          href="/auth/login"
          className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          Войти
        </Link>
      </p>
    </div>
  )
}
