'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="mb-4 text-2xl font-semibold">Что-то пошло не так</h2>
        <p className="mb-6 text-gray-600">
          Мы уже получили сведения об ошибке и работаем над исправлением.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Попробовать снова
        </button>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
