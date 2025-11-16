'use client'

import { useState } from 'react'
import Link from 'next/link'

type AdminTab = 'overview' | 'api-control' | 'subscriptions' | 'users' | 'locations' | 'franchises'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  const tabs = [
    { id: 'overview' as AdminTab, label: 'Обзор', href: '/admin' },
    { id: 'api-control' as AdminTab, label: 'API Control', href: '/admin/api-control' },
    { id: 'subscriptions' as AdminTab, label: 'Подписки', href: '/admin/subscriptions' },
    { id: 'users' as AdminTab, label: 'Пользователи', href: '/admin/users' },
    { id: 'locations' as AdminTab, label: 'Локации', href: '/admin/cities' },
    { id: 'franchises' as AdminTab, label: 'Франшизы', href: '/admin/franchises' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Админ-панель</h1>
          <p className="mt-2 text-gray-600">Управление платформой</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Обзор системы</h2>
              <p className="text-gray-600">Добро пожаловать в админ-панель!</p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">API Control</h3>
                  <p className="text-sm text-gray-600 mt-1">Управление API ключами и доступом</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Подписки</h3>
                  <p className="text-sm text-gray-600 mt-1">Управление подписками пользователей</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Пользователи</h3>
                  <p className="text-sm text-gray-600 mt-1">Управление пользователями и ролями</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api-control' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">API Control</h2>
              <p className="text-gray-600">Управление API ключами и доступом</p>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Функционал в разработке...</p>
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Подписки</h2>
              <p className="text-gray-600">Управление подписками пользователей</p>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Функционал в разработке...</p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Пользователи</h2>
              <p className="text-gray-600">Управление пользователями и ролями</p>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Функционал в разработке...</p>
              </div>
            </div>
          )}

          {activeTab === 'locations' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Локации</h2>
              <p className="text-gray-600">Управление городами и локациями</p>
              <div className="mt-4">
                <Link
                  href="/admin/cities"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Перейти к управлению городами →
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'franchises' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Франшизы</h2>
              <p className="text-gray-600">Управление франшизами</p>
              <div className="mt-4">
                <Link
                  href="/admin/franchises"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Перейти к управлению франшизами →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
