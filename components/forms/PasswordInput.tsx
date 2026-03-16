'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  id?: string
  name?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: string
  required?: boolean
}

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = 'Пароль',
  error,
  required = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`block w-full px-4 py-3 pr-12 border rounded-xl text-base shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-shadow ${
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Eye className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  )
}
