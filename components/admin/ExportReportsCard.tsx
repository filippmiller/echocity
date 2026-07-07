'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, FileSpreadsheet } from 'lucide-react'

const EXPORT_TYPES = [
  { value: 'offers', label: 'Офферы' },
  { value: 'redemptions', label: 'Выкупы' },
  { value: 'complaints', label: 'Жалобы' },
  { value: 'businesses', label: 'Бизнесы' },
] as const

type ExportType = (typeof EXPORT_TYPES)[number]['value']

export function ExportReportsCard() {
  const [type, setType] = useState<ExportType>('offers')
  const [exporting, setExporting] = useState(false)

  const handleDownload = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/admin/exports?type=${type}&format=csv`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Ошибка при экспорте')
      }

      const blob = await res.blob()
      const filename = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || `${type}-export.csv`
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Экспорт загружен')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось скачать отчёт')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4 text-gray-400" />
        Экспорт отчётов
      </h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ExportType)}
          className="flex-1 sm:flex-none text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {EXPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleDownload}
          disabled={exporting}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? 'Экспорт...' : 'Скачать CSV'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-3">Максимум 10 000 записей. Без персональных данных.</p>
    </div>
  )
}
