'use client'

import { useState } from 'react'

interface YandexBusinessVerificationProps {
  businessId: string
  isVerified?: boolean
  yandexOrgName?: string | null
}

interface YandexSearchResult {
  id: string
  name: string
  address: string
  phones?: string[]
  coordinates: [number, number]
}

export default function YandexBusinessVerification({
  businessId,
  isVerified = false,
  yandexOrgName,
}: YandexBusinessVerificationProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<YandexSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)
  const [linked, setLinked] = useState(isVerified)

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setError('Введите название, телефон или ИНН для поиска')
      return
    }

    setSearching(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch(
        `/api/integrations/yandex/places/search?text=${encodeURIComponent(searchText)}&limit=10`
      )

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'YANDEX_MAPS_NOT_CONFIGURED') {
          setError('Интеграция с Яндекс.Картами не настроена')
        } else {
          setError(data.message || 'Ошибка при поиске')
        }
        return
      }

      setResults(data.results || [])
      if (data.results?.length === 0) {
        setError('Ничего не найдено. Попробуйте другой запрос')
      }
    } catch (err: any) {
      setError('Ошибка при поиске: ' + err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleSelect = async (result: YandexSearchResult) => {
    setLinking(true)
    setError(null)

    try {
      // We need the full Yandex data, but for now we'll use what we have
      // In production, you might want to fetch full data by ID
      const response = await fetch(`/api/businesses/${businessId}/link-yandex`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yandexOrgId: result.id,
          yandexData: {
            id: result.id,
            properties: {
              name: result.name,
              description: result.address,
              CompanyMetaData: {
                name: result.name,
                address: result.address,
                Phones: result.phones?.map((phone) => ({ formatted: phone })) || [],
              },
            },
            geometry: {
              coordinates: result.coordinates,
            },
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при привязке')
      }

      setLinked(true)
      setShowSearch(false)
      setResults([])
      setSearchText('')
    } catch (err: any) {
      setError('Ошибка при привязке: ' + err.message)
    } finally {
      setLinking(false)
    }
  }

  if (linked) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">
              ✓ Данные подтянуты из Яндекс.Карт
            </p>
            {yandexOrgName && (
              <p className="text-xs text-green-600 mt-1">{yandexOrgName}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Подтверждение через Яндекс.Карты
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Вы можете найти вашу организацию в Яндекс.Картах и привязать её к EchoCity.
        Мы подтянем адрес, координаты и контакты из справочника Яндекса.
      </p>

      {!showSearch ? (
        <button
          onClick={() => setShowSearch(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          Найти в Яндексе
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название, телефон или ИНН
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                placeholder="Например: ООО Ромашка или +7 812 123-45-67"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {searching ? 'Поиск...' : 'Найти'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Найдено организаций: {results.length}
              </p>
              {results.map((result) => (
                <div
                  key={result.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{result.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{result.address}</p>
                      {result.phones && result.phones.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          📞 {result.phones.join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSelect(result)}
                      disabled={linking}
                      className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                    >
                      {linking ? 'Привязка...' : 'Выбрать'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setShowSearch(false)
              setSearchText('')
              setResults([])
              setError(null)
            }}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  )
}

