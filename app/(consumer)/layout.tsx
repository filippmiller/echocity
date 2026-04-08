import { SavingsMilestoneCelebration } from '@/components/SavingsMilestoneCelebration'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { PushPermissionBanner } from '@/components/PushPermissionBanner'
import { Footer } from '@/components/Footer'

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PushPermissionBanner />
      <OfflineIndicator />
      {children}
      <Footer />
      <SavingsMilestoneCelebration />
      <PWAInstallPrompt />
    </>
  )
}
