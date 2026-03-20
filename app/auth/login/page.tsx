'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, Phone, Mail } from 'lucide-react'
import { PasswordInput } from '@/components/forms/PasswordInput'
import YandexSignInButton from '@/components/YandexSignInButton'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>}>
      <LoginContent />
    </Suspense>
  )
}

type Tab = 'phone' | 'email'

function formatPhone(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '')
  // Remove leading 7 or 8 if user typed it
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
  // +7 912 345 67 89 → +79123456789
  return '+7' + formatted.replace(/\D/g, '').slice(1)
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  const [activeTab, setActiveTab] = useState<Tab>('phone')

  // Email tab state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

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

  const redirectAfterLogin = (role: string) => {
    if (redirectTo) {
      router.push(redirectTo)
    } else if (role === 'CITIZEN') {
      router.push('/map')
    } else if (role === 'BUSINESS_OWNER') {
      router.push('/business/places')
    } else if (role === 'ADMIN') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }

  // ---- Email login ----
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Заполните все поля')
      return
    }
    setEmailLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Неверный email или пароль')
        return
      }
      toast.success('Добро пожаловать!')
      redirectAfterLogin(data.user.role)
    } catch {
      toast.error('Ошибка при входе. Попробуйте позже.')
    } finally {
      setEmailLoading(false)
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
      toast.success('Добро пожаловать!')
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
        <h1 className="text-2xl font-bold text-gray-900">Вход в аккаунт</h1>
        <p className="mt-1 text-sm text-gray-500">Войдите, чтобы видеть скидки рядом с вами</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {/* Tabs */}
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

        {/* Phone tab */}
        {activeTab === 'phone' && (
          <div className="space-y-5">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Номер телефона
              </label>
              <input
                id="phone"
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
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Код из SMS
                  </label>
                  <input
                    id="code"
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
                    'Войти'
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

        {/* Email tab */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Пароль
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={emailLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60 disabled:pointer-events-none transition-all min-h-[48px]"
            >
              {emailLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </button>
          </form>
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

      {/* Switch to register */}
      <p className="text-center text-sm text-gray-500">
        Нет аккаунта?{' '}
        <Link
          href="/auth/register"
          className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}
