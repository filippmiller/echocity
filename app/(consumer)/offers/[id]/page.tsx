import type { Metadata } from 'next'
import { getOfferById } from '@/modules/offers/service'
import { OfferDetailClient, type OfferDetail } from '@/components/OfferDetailClient'

export const dynamic = 'force-dynamic'

function getBenefitLabel(benefitType: string, benefitValue: number): string {
  switch (benefitType) {
    case 'PERCENT': return `Скидка ${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${Math.round(benefitValue)}\u20BD`
    case 'FIXED_PRICE': return `${Math.round(benefitValue)}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    case 'BUNDLE': return 'Комплект'
    default: return String(benefitValue)
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const offer = await getOfferById(id)

  if (!offer) {
    return { title: 'Предложение не найдено | ГдеСейчас' }
  }

  const discount = getBenefitLabel(offer.benefitType, Number(offer.benefitValue))
  const title = `${discount} — ${offer.title} | ГдеСейчас`
  const description = `${offer.subtitle || offer.description || offer.title} в ${offer.branch.title}`
  const images = offer.imageUrl ? [offer.imageUrl] : []

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

type OfferPageProps = {
  params: Promise<{ id: string }>
}

export default async function OfferDetailPage({ params }: OfferPageProps) {
  const { id } = await params
  const offer = await getOfferById(id)
  const serializedOffer = offer ? JSON.parse(JSON.stringify(offer)) as OfferDetail : null

  return <OfferDetailClient offer={serializedOffer} />
}
