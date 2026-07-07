import { prisma } from '@/lib/prisma'

export interface TrackOfferViewInput {
  userId?: string | null
  source?: string | null
}

export async function trackOfferView(offerId: string, input: TrackOfferViewInput = {}) {
  return prisma.offerView.create({
    data: {
      offerId,
      userId: input.userId ?? null,
      source: input.source ?? 'unknown',
    },
  })
}

export interface TrackOfferSaveInput {
  userId: string
  source?: string | null
}

export async function trackOfferSave(offerId: string, input: TrackOfferSaveInput) {
  return prisma.offerSave.createMany({
    data: [
      {
        offerId,
        userId: input.userId,
        source: input.source ?? 'unknown',
      },
    ],
    skipDuplicates: true,
  })
}
