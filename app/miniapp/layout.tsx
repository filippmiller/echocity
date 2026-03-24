import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'ГдеСейчас',
  description: 'Скидки рядом с вами',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {children}
      {/* Bottom navigation for mini app */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-50">
        <a href="/miniapp" className="flex flex-col items-center text-xs text-gray-500 hover:text-blue-500">
          <span className="text-lg">🏷</span>
          <span>Скидки</span>
        </a>
        <a href="/miniapp/map" className="flex flex-col items-center text-xs text-gray-500 hover:text-blue-500">
          <span className="text-lg">🗺</span>
          <span>Карта</span>
        </a>
      </nav>
    </div>
  )
}
