import { getOfferById } from '@/modules/offers/service'
import { OfferDetailClient, type OfferDetail } from '@/components/OfferDetailClient'

export const dynamic = 'force-dynamic'

type OfferPageProps = {
  params: Promise<{ id: string }>
}

export default async function OfferDetailPage({ params }: OfferPageProps) {
  const { id } = await params
  const offer = await getOfferById(id)
  const serializedOffer = offer ? JSON.parse(JSON.stringify(offer)) as OfferDetail : null

  return <OfferDetailClient offer={serializedOffer} />
}
