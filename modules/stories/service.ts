import { prisma } from '@/lib/prisma'
import type { StoryMediaType } from '@prisma/client'

const STORY_LIFETIME_HOURS = 24

interface CreateStoryInput {
  mediaUrl: string
  mediaType?: StoryMediaType
  caption?: string
  linkOfferId?: string
}

/**
 * Create a story with 24h auto-expiry
 */
export async function createStory(
  merchantId: string,
  branchId: string,
  data: CreateStoryInput
) {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + STORY_LIFETIME_HOURS)

  return prisma.story.create({
    data: {
      merchantId,
      branchId,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType || 'IMAGE',
      caption: data.caption || null,
      linkOfferId: data.linkOfferId || null,
      expiresAt,
    },
    include: {
      branch: { select: { id: true, title: true, address: true } },
      merchant: { select: { id: true, name: true } },
      offer: { select: { id: true, title: true } },
    },
  })
}

/**
 * Get active (non-expired) stories, optionally filtered by city or branch
 */
export async function getActiveStories(filter?: { city?: string; branchId?: string }) {
  const now = new Date()

  return prisma.story.findMany({
    where: {
      isActive: true,
      expiresAt: { gt: now },
      ...(filter?.branchId ? { branchId: filter.branchId } : {}),
      ...(filter?.city ? { branch: { city: filter.city, isActive: true } } : {}),
    },
    include: {
      branch: { select: { id: true, title: true, address: true, city: true } },
      merchant: { select: { id: true, name: true } },
      offer: { select: { id: true, title: true } },
      views: { select: { userId: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Record a story view (upsert — one view per user per story)
 */
export async function recordView(storyId: string, userId: string) {
  // Check if this is a first view to increment counter
  const existing = await prisma.storyView.findUnique({
    where: { storyId_userId: { storyId, userId } },
  })

  const view = await prisma.storyView.upsert({
    where: { storyId_userId: { storyId, userId } },
    create: { storyId, userId },
    update: { viewedAt: new Date() },
  })

  // Increment view count only on first view
  if (!existing) {
    await prisma.story.update({
      where: { id: storyId },
      data: { viewCount: { increment: 1 } },
    })
  }

  return view
}

/**
 * Expire stories past their expiresAt (for cron job)
 */
export async function expireStories() {
  const now = new Date()
  const result = await prisma.story.updateMany({
    where: {
      isActive: true,
      expiresAt: { lte: now },
    },
    data: { isActive: false },
  })
  return result.count
}

/**
 * Get stories by merchant (for business dashboard)
 */
export async function getStoriesByMerchant(merchantId: string) {
  return prisma.story.findMany({
    where: { merchantId },
    include: {
      branch: { select: { id: true, title: true, address: true } },
      offer: { select: { id: true, title: true } },
      _count: { select: { views: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
