'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X,
  AlertTriangle,
  UserX,
  Megaphone,
  Calculator,
  ShieldAlert,
  FileWarning,
  HelpCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
} from 'lucide-react'

type ComplaintType =
  | 'OFFER_NOT_HONORED'
  | 'RUDE_STAFF'
  | 'FALSE_ADVERTISING'
  | 'WRONG_DISCOUNT'
  | 'FRAUD'
  | 'CONTENT_ISSUE'
  | 'OTHER'

interface Props {
  placeId?: string
  offerId?: string
  onClose: () => void
}

const COMPLAINT_TYPES: { value: ComplaintType; label: string; icon: typeof AlertTriangle }[] = [
  { value: 'OFFER_NOT_HONORED', label: 'Скидка не применена', icon: AlertTriangle },
  { value: 'RUDE_STAFF', label: 'Грубый персонал', icon: UserX },
  { value: 'FALSE_ADVERTISING', label: 'Ложная реклама', icon: Megaphone },
  { value: 'WRONG_DISCOUNT', label: 'Неверная скидка', icon: Calculator },
  { value: 'FRAUD', label: 'Мошенничество', icon: ShieldAlert },
  { value: 'CONTENT_ISSUE', label: 'Проблема с контентом', icon: FileWarning },
  { value: 'OTHER', label: 'Другое', icon: HelpCircle },
]

export function ComplaintSheet({ placeId, offerId, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedType, setSelectedType] = useState<ComplaintType | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Focus textarea on step 2
  useEffect(() => {
    if (step === 2 && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [step])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSelectType = (type: ComplaintType) => {
    setSelectedType(type)
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!selectedType || description.trim().length < 20) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: placeId || undefined,
          offerId: offerId || undefined,
          type: selectedType,
          description: description.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }

      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Report a problem"
    >
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-base font-semibold text-gray-900">
              {step === 1 && 'Расскажите, что произошло'}
              {step === 2 && 'Опишите ситуацию'}
              {step === 3 && 'Спасибо за обращение'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Step 1: Select type */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2">
              {COMPLAINT_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleSelectType(value)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all text-center group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-brand-600 transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-tight">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Selected type badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                {(() => {
                  const found = COMPLAINT_TYPES.find((t) => t.value === selectedType)
                  if (!found) return null
                  const Icon = found.icon
                  return (
                    <>
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{found.label}</span>
                    </>
                  )
                })()}
              </div>

              <div>
                <textarea
                  ref={textareaRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Расскажите подробнее, что именно пошло не так. Это поможет нам разобраться в ситуации..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none placeholder:text-gray-400"
                  rows={5}
                  maxLength={2000}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className={`text-xs ${description.trim().length < 20 ? 'text-gray-400' : 'text-green-600'}`}>
                    {description.trim().length < 20
                      ? `Минимум 20 символов (${description.trim().length}/20)`
                      : `${description.trim().length} / 2000`}
                  </p>
                </div>
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || description.trim().length < 20}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Отправить жалобу'
                )}
              </button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4 animate-[scale-in_0.3s_ease-out]">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Жалоба отправлена
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs">
                Мы рассмотрим ваше обращение в ближайшее время. Спасибо, что помогаете улучшить сервис.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
