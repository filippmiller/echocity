import { SavingsMilestoneCelebration } from '@/components/SavingsMilestoneCelebration'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { OfflineIndicator } from '@/components/OfflineIndicator'

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <OfflineIndicator />
      {children}
      <SavingsMilestoneCelebration />
      <PWAInstallPrompt />
    </>
  )
}
