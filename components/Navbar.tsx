'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function Navbar() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold">
                CityEcho
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              CityEcho
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/for-users"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                For users
              </Link>
              <Link
                href="/for-businesses"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                For businesses
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {!user ? (
              <div className="flex space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="relative">
                {user.role === 'USER' && (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium mr-4"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Привет, {user.email.split('@')[0]}
                    </button>
                  </>
                )}

                {user.role === 'BUSINESS_OWNER' && (
                  <>
                    <Link
                      href="/business/dashboard"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium mr-4"
                    >
                      My places
                    </Link>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      {user.email.split('@')[0]}
                    </button>
                  </>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      href="/admin"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium mr-2"
                    >
                      Admin
                    </Link>
                    <Link
                      href="/admin/cities"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium mr-2"
                    >
                      Cities
                    </Link>
                    <Link
                      href="/admin/franchises"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium mr-4"
                    >
                      Franchises
                    </Link>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      {user.email.split('@')[0]}
                    </button>
                  </>
                )}

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                      {user.role === 'USER' && (
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowMenu(false)}
                        >
                          Profile
                        </Link>
                      )}
                      {user.role === 'BUSINESS_OWNER' && (
                        <Link
                          href="/business/account"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowMenu(false)}
                        >
                          Account
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          handleLogout()
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

