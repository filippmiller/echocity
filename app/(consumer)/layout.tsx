import { SavingsMilestoneCelebration } from '@/components/SavingsMilestoneCelebration'

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <SavingsMilestoneCelebration />
    </>
  )
}
