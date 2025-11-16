'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Check, Loader2 } from 'lucide-react'

interface UserProfile {
  id: string
  fullName?: string | null
  phone?: string | null
  homeCity?: string | null
  preferredLanguage?: string | null
  timezone?: string | null
  preferredRadius?: number | null
  notificationsEnabled?: boolean
  emailNotifications?: boolean
  pushNotifications?: boolean
  favoriteCity?: string | null
  avatarUrl?: string | null
  user: {
    id: string
    email: string
    firstName: string
    lastName?: string | null
    city: string
    language: string
  }
}

interface UserPhoto {
  id: string
  url: string
  isAvatar: boolean
  createdAt: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [photos, setPhotos] = useState<UserPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    homeCity: '',
    preferredLanguage: 'ru' as 'ru' | 'en',
    timezone: '',
    preferredRadius: '',
    notificationsEnabled: true,
    emailNotifications: true,
    pushNotifications: false,
    favoriteCity: '',
  })

  useEffect(() => {
    loadProfile()
    loadPhotos()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setFormData({
          fullName: data.profile.fullName || '',
          phone: data.profile.phone || '',
          homeCity: data.profile.homeCity || '',
          preferredLanguage: data.profile.preferredLanguage || 'ru',
          timezone: data.profile.timezone || '',
          preferredRadius: data.profile.preferredRadius?.toString() || '',
          notificationsEnabled: data.profile.notificationsEnabled ?? true,
          emailNotifications: data.profile.emailNotifications ?? true,
          pushNotifications: data.profile.pushNotifications ?? false,
          favoriteCity: data.profile.favoriteCity || '',
        })
      }
    } catch (err) {
      setError('Ошибка при загрузке профиля')
    } finally {
      setLoading(false)
    }
  }

  const loadPhotos = async () => {
    try {
      const res = await fetch('/api/profile/photos')
      if (res.ok) {
        const data = await res.json()
        setPhotos(data.photos || [])
      }
    } catch (err) {
      // Ignore
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const payload: any = {
        fullName: formData.fullName || undefined,
        phone: formData.phone || undefined,
        homeCity: formData.homeCity || undefined,
        preferredLanguage: formData.preferredLanguage,
        timezone: formData.timezone || undefined,
        notificationsEnabled: formData.notificationsEnabled,
        emailNotifications: formData.emailNotifications,
        pushNotifications: formData.pushNotifications,
        favoriteCity: formData.favoriteCity || undefined,
      }

      if (formData.preferredRadius) {
        payload.preferredRadius = parseInt(formData.preferredRadius, 10)
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Ошибка при сохранении')
        return
      }

      setSuccess('Профиль успешно обновлён')
      setTimeout(() => setSuccess(null), 3000)
      loadProfile()
    } catch (err) {
      setError('Ошибка при сохранении профиля')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Ошибка при загрузке аватара')
        return
      }

      setSuccess('Аватар успешно загружен')
      setTimeout(() => setSuccess(null), 3000)
      loadProfile()
      loadPhotos()
    } catch (err) {
      setError('Ошибка при загрузке аватара')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploadingPhoto(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/profile/photos', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Ошибка при загрузке фотографии')
        return
      }

      setSuccess('Фотография успешно загружена')
      setTimeout(() => setSuccess(null), 3000)
      loadPhotos()
    } catch (err) {
      setError('Ошибка при загрузке фотографии')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const handleSetAvatar = async (photoId: string) => {
    try {
      const res = await fetch(`/api/profile/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvatar: true }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Ошибка при установке аватара')
        return
      }

      setSuccess('Аватар успешно установлен')
      setTimeout(() => setSuccess(null), 3000)
      loadProfile()
      loadPhotos()
    } catch (err) {
      setError('Ошибка при установке аватара')
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Удалить эту фотографию?')) return

    try {
      const res = await fetch(`/api/profile/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Ошибка при удалении фотографии')
        return
      }

      setSuccess('Фотография удалена')
      setTimeout(() => setSuccess(null), 3000)
      loadProfile()
      loadPhotos()
    } catch (err) {
      setError('Ошибка при удалении фотографии')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Настройки профиля</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
            {success}
          </div>
        )}

        {/* Avatar Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Аватар</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl font-semibold">
                  {profile?.user.firstName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingAvatar ? 'Загрузка...' : 'Загрузить аватар'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
              <p className="mt-2 text-sm text-gray-500">
                JPEG, PNG или WebP, максимум 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Основная информация</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Полное имя
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Домашний город
              </label>
              <input
                type="text"
                value={formData.homeCity}
                onChange={(e) => setFormData({ ...formData, homeCity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Язык интерфейса
              </label>
              <select
                value={formData.preferredLanguage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preferredLanguage: e.target.value as 'ru' | 'en',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Радиус поиска (метры)
              </label>
              <input
                type="number"
                value={formData.preferredRadius}
                onChange={(e) => setFormData({ ...formData, preferredRadius: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5000"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notificationsEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, notificationsEnabled: e.target.checked })
                  }
                  className="mr-2"
                />
                Уведомления включены
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) =>
                    setFormData({ ...formData, emailNotifications: e.target.checked })
                  }
                  className="mr-2"
                />
                Email уведомления
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить изменения'
              )}
            </button>
          </form>
        </div>

        {/* Photo Gallery */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Фотогалерея</h2>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadingPhoto ? 'Загрузка...' : 'Добавить фотографию'}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhoto}
            />
          </div>
          {photos.length === 0 ? (
            <p className="text-gray-500">Нет загруженных фотографий</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt="Photo"
                    className="w-full h-32 object-cover rounded-md border-2 border-gray-200"
                  />
                  {photo.isAvatar && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-md flex items-center justify-center gap-2">
                    {!photo.isAvatar && (
                      <button
                        onClick={() => handleSetAvatar(photo.id)}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Сделать аватаром
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
