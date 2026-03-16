import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white flex flex-col">
      {/* Branded header */}
      <header className="w-full px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between h-14">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors min-h-[44px] min-w-[44px] justify-center -ml-2 rounded-xl"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm font-medium hidden sm:inline">На главную</span>
          </Link>
          <Link href="/" className="text-lg font-bold text-gray-900">
            ГдеСейчас
          </Link>
          {/* Spacer to center the logo */}
          <div className="min-w-[44px]" />
        </div>
      </header>

      {/* Page content — vertically centered */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-400">
        &copy; 2024-2026 ГдеСейчас
      </footer>
    </div>
  )
}
