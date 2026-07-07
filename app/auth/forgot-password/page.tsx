'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setDevResetUrl(null)

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Не удалось отправить инструкции')
        return
      }

      setSubmitted(true)
      setDevResetUrl(data.resetUrl || null)
      toast.success('Проверьте почту')
    } catch {
      toast.error('Ошибка при отправке. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Восстановление пароля</h1>
        <p className="mt-1 text-sm text-gray-500">Введите email, и мы отправим ссылку для сброса</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {submitted ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Mail className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Письмо отправлено</h2>
              <p className="mt-2 text-sm text-gray-500">
                Если такой аккаунт существует, ссылка для восстановления придет на указанный email.
              </p>
            </div>
            {devResetUrl && (
              <Link
                href={devResetUrl}
                className="block rounded-xl border border-dashed border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                Открыть dev-ссылку восстановления
              </Link>
            )}
            <Link
              href="/auth/login"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Вернуться ко входу
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-base shadow-sm placeholder:text-gray-400 transition-shadow focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Отправить ссылку'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
