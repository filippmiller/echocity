import { prisma } from '@/lib/prisma'

const REVIEW_COINS_TEXT = 10
const REVIEW_COINS_PHOTO = 25

/**
 * Award coins for writing a review.
 * Text-only review = 10 coins, photo review = 25 coins.
 */
export async function awardReviewCoins(
  userId: string,
  reviewId: string,
  hasPhotos: boolean,
): Promise<{ coins: number }> {
  const coins = hasPhotos ? REVIEW_COINS_PHOTO : REVIEW_COINS_TEXT

  await prisma.$transaction([
    prisma.coinTransaction.create({
      data: {
        userId,
        amount: coins,
        type: 'REVIEW_REWARD',
        description: hasPhotos
          ? 'Награда за отзыв с фото'
          : 'Награда за текстовый отзыв',
        referenceId: reviewId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { coinBalance: { increment: coins } },
    }),
  ])

  return { coins }
}
