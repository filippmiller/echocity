import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import type { MissionType, MissionStatus } from '@prisma/client'

/**
 * Calculate level from total XP.
 * Formula: level = floor(sqrt(totalXp / 100)) + 1
 */
function calculateLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100)) + 1
}

/**
 * Get or create UserXP record for a user.
 */
export async function getOrCreateUserXP(userId: string) {
  let userXp = await prisma.userXP.findUnique({ where: { userId } })

  if (!userXp) {
    userXp = await prisma.userXP.create({
      data: { userId, totalXp: 0, level: 1 },
    })
  }

  return userXp
}

/**
 * Add XP to a user and recalculate their level.
 * Uses atomic increment to prevent race conditions.
 */
export async function addXP(userId: string, amount: number) {
  await getOrCreateUserXP(userId) // ensure record exists

  const updated = await prisma.userXP.update({
    where: { userId },
    data: { totalXp: { increment: amount } },
  })

  const newLevel = calculateLevel(updated.totalXp)
  if (newLevel !== updated.level) {
    await prisma.userXP.update({
      where: { userId },
      data: { level: newLevel },
    })
    logger.info('gamification.level_up', {
      userId,
      oldLevel: updated.level,
      newLevel,
      totalXp: updated.totalXp,
    })
    updated.level = newLevel
  }

  return updated
}

/**
 * Map event types to mission types for progress tracking.
 */
const EVENT_TO_MISSION: Record<string, MissionType[]> = {
  redemption: ['FIRST_REDEMPTION', 'REDEEM_COUNT'],
  visit_place: ['VISIT_PLACES'],
  referral: ['REFER_FRIENDS'],
  review: ['WRITE_REVIEWS'],
  streak: ['STREAK_DAYS'],
  savings: ['SAVE_AMOUNT'],
}

/**
 * Called after user actions to increment mission progress.
 * eventType: 'redemption' | 'visit_place' | 'referral' | 'review' | 'streak' | 'savings'
 * value: increment amount (defaults to 1, use kopecks for savings)
 */
export async function checkAndProgressMissions(
  userId: string,
  eventType: string,
  value: number = 1
) {
  const missionTypes = EVENT_TO_MISSION[eventType]
  if (!missionTypes || missionTypes.length === 0) return

  // Find active missions matching this event type
  const missions = await prisma.mission.findMany({
    where: {
      type: { in: missionTypes },
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })

  if (missions.length === 0) return

  for (const mission of missions) {
    // Get or create user mission progress
    let userMission = await prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId: mission.id } },
    })

    if (!userMission) {
      userMission = await prisma.userMission.create({
        data: { userId, missionId: mission.id, currentValue: 0, status: 'ACTIVE' },
      })
    }

    // Skip already completed missions
    if (userMission.status === 'COMPLETED') continue

    // Increment progress
    const newValue = userMission.currentValue + value

    await prisma.userMission.update({
      where: { id: userMission.id },
      data: { currentValue: newValue },
    })

    // Check if mission is now complete
    if (newValue >= mission.targetValue) {
      await completeMission(userId, mission.id)
    }
  }
}

/**
 * Mark a mission as complete and grant its XP reward.
 */
export async function completeMission(userId: string, missionId: string) {
  const mission = await prisma.mission.findUnique({ where: { id: missionId } })
  if (!mission) return

  const userMission = await prisma.userMission.findUnique({
    where: { userId_missionId: { userId, missionId } },
  })

  if (!userMission || userMission.status === 'COMPLETED') return

  await prisma.userMission.update({
    where: { id: userMission.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      currentValue: Math.max(userMission.currentValue, mission.targetValue),
    },
  })

  // Grant XP reward
  await addXP(userId, mission.xpReward)

  logger.info('gamification.mission_completed', {
    userId,
    missionCode: mission.code,
    xpReward: mission.xpReward,
  })
}

/**
 * Get all missions for a user with their progress.
 */
export async function getUserMissions(userId: string) {
  const missions = await prisma.mission.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { sortOrder: 'asc' },
  })

  const userMissions = await prisma.userMission.findMany({
    where: { userId, missionId: { in: missions.map((m) => m.id) } },
  })

  const progressMap = new Map(userMissions.map((um) => [um.missionId, um]))

  return missions.map((mission) => {
    const progress = progressMap.get(mission.id)
    return {
      id: mission.id,
      code: mission.code,
      title: mission.title,
      description: mission.description,
      iconEmoji: mission.iconEmoji,
      type: mission.type,
      targetValue: mission.targetValue,
      xpReward: mission.xpReward,
      currentValue: progress?.currentValue ?? 0,
      status: (progress?.status ?? 'ACTIVE') as MissionStatus,
      completedAt: progress?.completedAt ?? null,
    }
  })
}

/**
 * Get all badges earned by a user.
 */
export async function getUserBadges(userId: string) {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  })

  return userBadges.map((ub) => ({
    id: ub.badge.id,
    code: ub.badge.code,
    title: ub.badge.title,
    description: ub.badge.description,
    iconEmoji: ub.badge.iconEmoji,
    category: ub.badge.category,
    earnedAt: ub.earnedAt,
  }))
}

/**
 * Get all active missions (for listing available missions).
 */
export async function getAvailableMissions() {
  return prisma.mission.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * Grant a badge to a user if they haven't already earned it.
 */
export async function grantBadge(userId: string, badgeCode: string) {
  const badge = await prisma.badge.findUnique({ where: { code: badgeCode } })
  if (!badge) {
    logger.warn('gamification.badge_not_found', { badgeCode })
    return null
  }

  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  })

  if (existing) return existing

  const userBadge = await prisma.userBadge.create({
    data: { userId, badgeId: badge.id },
    include: { badge: true },
  })

  logger.info('gamification.badge_granted', {
    userId,
    badgeCode,
    badgeTitle: badge.title,
  })

  return userBadge
}

/**
 * Check if a user has earned new badges based on their stats.
 * Call this after significant actions (redemptions, reviews, etc).
 */
export async function checkBadgeEligibility(userId: string) {
  const granted: string[] = []

  // Count redemptions
  const redemptionCount = await prisma.redemption.count({
    where: { userId, status: 'SUCCESS' },
  })

  if (redemptionCount >= 1) {
    const b = await grantBadge(userId, 'first_deal')
    if (b) granted.push('first_deal')
  }

  if (redemptionCount >= 25) {
    const b = await grantBadge(userId, 'deal_master')
    if (b) granted.push('deal_master')
  }

  // Count unique places visited (via redemptions)
  const uniquePlaces = await prisma.redemption.groupBy({
    by: ['branchId'],
    where: { userId, status: 'SUCCESS' },
  })

  if (uniquePlaces.length >= 5) {
    const b = await grantBadge(userId, 'explorer')
    if (b) granted.push('explorer')
  }

  if (uniquePlaces.length >= 15) {
    const b = await grantBadge(userId, 'city_guru')
    if (b) granted.push('city_guru')
  }

  // Count referrals
  const referralCode = await prisma.referralCode.findUnique({ where: { userId } })
  if (referralCode) {
    const completedReferrals = await prisma.referral.count({
      where: { referralCodeId: referralCode.id, status: 'COMPLETED' },
    })
    if (completedReferrals >= 3) {
      const b = await grantBadge(userId, 'social_star')
      if (b) granted.push('social_star')
    }
  }

  // Count reviews
  const reviewCount = await prisma.review.count({
    where: { userId, isPublished: true, isDeleted: false },
  })

  if (reviewCount >= 5) {
    const b = await grantBadge(userId, 'top_reviewer')
    if (b) granted.push('top_reviewer')
  }

  // Check completed streak missions
  const streakMissions = await prisma.userMission.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      mission: { type: 'STREAK_DAYS' },
    },
    include: { mission: true },
  })

  const maxStreak = streakMissions.reduce(
    (max, um) => Math.max(max, um.mission.targetValue),
    0
  )

  if (maxStreak >= 7) {
    const b = await grantBadge(userId, 'streak_champion')
    if (b) granted.push('streak_champion')
  }

  // Check total savings
  const savingsAgg = await prisma.userSavings.aggregate({
    where: { userId },
    _sum: { savedAmount: true },
  })

  const totalSaved = savingsAgg._sum.savedAmount ?? 0
  if (totalSaved >= 500000) {
    // 5000 RUB in kopecks
    const b = await grantBadge(userId, 'big_saver')
    if (b) granted.push('big_saver')
  }

  return granted
}
