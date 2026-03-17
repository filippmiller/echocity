import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface MissionSeed {
  code: string
  title: string
  description: string
  iconEmoji: string
  type: 'FIRST_REDEMPTION' | 'REDEEM_COUNT' | 'VISIT_PLACES' | 'REFER_FRIENDS' | 'WRITE_REVIEWS' | 'STREAK_DAYS' | 'SAVE_AMOUNT' | 'EXPLORE_CATEGORIES'
  targetValue: number
  xpReward: number
  sortOrder: number
}

interface BadgeSeed {
  code: string
  title: string
  description: string
  iconEmoji: string
  category: string
  sortOrder: number
}

const MISSIONS: MissionSeed[] = [
  {
    code: 'FIRST_STEPS',
    title: 'Первые шаги',
    description: 'Активируйте свою первую скидку',
    iconEmoji: '👣',
    type: 'FIRST_REDEMPTION',
    targetValue: 1,
    xpReward: 20,
    sortOrder: 1,
  },
  {
    code: 'DEAL_HUNTER',
    title: 'Охотник за скидками',
    description: 'Активируйте 5 предложений',
    iconEmoji: '🎯',
    type: 'REDEEM_COUNT',
    targetValue: 5,
    xpReward: 50,
    sortOrder: 2,
  },
  {
    code: 'MEGA_SAVER',
    title: 'Мега-экономист',
    description: 'Активируйте 25 предложений',
    iconEmoji: '💎',
    type: 'REDEEM_COUNT',
    targetValue: 25,
    xpReward: 200,
    sortOrder: 3,
  },
  {
    code: 'EXPLORER',
    title: 'Исследователь',
    description: 'Посетите 5 разных заведений',
    iconEmoji: '🧭',
    type: 'VISIT_PLACES',
    targetValue: 5,
    xpReward: 50,
    sortOrder: 4,
  },
  {
    code: 'CITY_MASTER',
    title: 'Знаток города',
    description: 'Посетите 15 разных заведений',
    iconEmoji: '🏙️',
    type: 'VISIT_PLACES',
    targetValue: 15,
    xpReward: 150,
    sortOrder: 5,
  },
  {
    code: 'SOCIAL_BUTTERFLY',
    title: 'Душа компании',
    description: 'Пригласите 3 друзей',
    iconEmoji: '🦋',
    type: 'REFER_FRIENDS',
    targetValue: 3,
    xpReward: 100,
    sortOrder: 6,
  },
  {
    code: 'REVIEWER',
    title: 'Критик',
    description: 'Напишите 5 отзывов',
    iconEmoji: '✍️',
    type: 'WRITE_REVIEWS',
    targetValue: 5,
    xpReward: 75,
    sortOrder: 7,
  },
  {
    code: 'STREAK_3',
    title: 'Серия 3 дня',
    description: 'Используйте приложение 3 дня подряд',
    iconEmoji: '🔥',
    type: 'STREAK_DAYS',
    targetValue: 3,
    xpReward: 30,
    sortOrder: 8,
  },
  {
    code: 'STREAK_7',
    title: 'Серия 7 дней',
    description: 'Используйте приложение 7 дней подряд',
    iconEmoji: '🔥',
    type: 'STREAK_DAYS',
    targetValue: 7,
    xpReward: 100,
    sortOrder: 9,
  },
  {
    code: 'BIG_SAVER',
    title: 'Большая экономия',
    description: 'Сэкономьте 5 000 ₽',
    iconEmoji: '💰',
    type: 'SAVE_AMOUNT',
    targetValue: 500000, // 5000 RUB in kopecks
    xpReward: 200,
    sortOrder: 10,
  },
]

const BADGES: BadgeSeed[] = [
  {
    code: 'first_deal',
    title: 'Первая сделка',
    description: 'Активировали первую скидку',
    iconEmoji: '🤝',
    category: 'loyalty',
    sortOrder: 1,
  },
  {
    code: 'deal_master',
    title: 'Мастер скидок',
    description: 'Активировали 25 скидок',
    iconEmoji: '👑',
    category: 'loyalty',
    sortOrder: 2,
  },
  {
    code: 'explorer',
    title: 'Исследователь',
    description: 'Посетили 5 разных заведений',
    iconEmoji: '🧭',
    category: 'explorer',
    sortOrder: 3,
  },
  {
    code: 'city_guru',
    title: 'Знаток города',
    description: 'Посетили 15 разных заведений',
    iconEmoji: '🏙️',
    category: 'explorer',
    sortOrder: 4,
  },
  {
    code: 'social_star',
    title: 'Социальная звезда',
    description: 'Пригласили 3 друзей',
    iconEmoji: '⭐',
    category: 'social',
    sortOrder: 5,
  },
  {
    code: 'top_reviewer',
    title: 'Топ-рецензент',
    description: 'Написали 5 отзывов',
    iconEmoji: '📝',
    category: 'social',
    sortOrder: 6,
  },
  {
    code: 'streak_champion',
    title: 'Чемпион серий',
    description: 'Достигли серии в 7 дней',
    iconEmoji: '🔥',
    category: 'loyalty',
    sortOrder: 7,
  },
  {
    code: 'big_saver',
    title: 'Экономист',
    description: 'Сэкономили 5 000 ₽',
    iconEmoji: '💰',
    category: 'loyalty',
    sortOrder: 8,
  },
]

/**
 * Seed starter missions and badges into the database.
 * Uses upsert to be idempotent (safe to run multiple times).
 */
export async function seedMissionsAndBadges() {
  logger.info('gamification.seed.start', { missions: MISSIONS.length, badges: BADGES.length })

  // Seed missions
  for (const mission of MISSIONS) {
    await prisma.mission.upsert({
      where: { code: mission.code },
      create: mission,
      update: {
        title: mission.title,
        description: mission.description,
        iconEmoji: mission.iconEmoji,
        type: mission.type,
        targetValue: mission.targetValue,
        xpReward: mission.xpReward,
        sortOrder: mission.sortOrder,
      },
    })
  }

  // Seed badges
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      create: badge,
      update: {
        title: badge.title,
        description: badge.description,
        iconEmoji: badge.iconEmoji,
        category: badge.category,
        sortOrder: badge.sortOrder,
      },
    })
  }

  logger.info('gamification.seed.complete', { missions: MISSIONS.length, badges: BADGES.length })

  return { missions: MISSIONS.length, badges: BADGES.length }
}
