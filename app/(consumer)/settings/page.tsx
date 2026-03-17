'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ReferralCard } from '@/components/ReferralCard'
import { SavingsCounter } from '@/components/SavingsCounter'
import { NotificationSettings } from '@/components/NotificationSettings'

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
  // Errors/success handled via toast notifications
  
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
      toast.error('Ошибка при загрузке профиля')
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
        toast.error(data.error || 'Ошибка при сохранении')
        return
      }

      toast.success('Профиль успешно обновлён')
      loadProfile()
    } catch (err) {
      toast.error('Ошибка при сохранении профиля')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
        toast.error(data.error || 'Ошибка при загрузке аватара')
        return
      }

      toast.success('Аватар успешно загружен')
      loadProfile()
      loadPhotos()
    } catch (err) {
      toast.error('Ошибка при загрузке аватара')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
        toast.error(data.error || 'Ошибка при загрузке фотографии')
        return
      }

      toast.success('Фотография успешно загружена')
      loadPhotos()
    } catch (err) {
      toast.error('Ошибка при загрузке фотографии')
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
        toast.error(data.error || 'Ошибка при установке аватара')
        return
      }

      toast.success('Аватар успешно установлен')
      loadProfile()
      loadPhotos()
    } catch (err) {
      toast.error('Ошибка при установке аватара')
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
        toast.error(data.error || 'Ошибка при удалении фотографии')
        return
      }

      toast.success('Фотография удалена')
      loadProfile()
      loadPhotos()
    } catch (err) {
      toast.error('Ошибка при удалении фотографии')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки профиля</h1>

        {/* Savings Counter */}
        <div className="mb-6">
          <SavingsCounter variant="profile" />
        </div>

        {/* Referral Card */}
        <div className="mb-6">
          <ReferralCard />
        </div>

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
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="5000"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

        {/* Notification Settings */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Уведомления</h2>
          <NotificationSettings />
        </div>

        {/* Photo Gallery */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Фотогалерея</h2>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="absolute top-2 right-2 bg-brand-600 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-md flex items-center justify-center gap-2">
                    {!photo.isAvatar && (
                      <button
                        onClick={() => handleSetAvatar(photo.id)}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-brand-600 text-white rounded text-sm hover:bg-brand-700"
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
