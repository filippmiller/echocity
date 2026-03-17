import { z } from 'zod'

export const createOfferSchema = z.object({
  merchantId: z.string().min(1),
  branchId: z.string().min(1),
  title: z.string().min(3).max(100),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  offerType: z.enum(['PERCENT_DISCOUNT', 'FIXED_PRICE', 'FREE_ITEM', 'BUNDLE', 'FIRST_VISIT', 'OFF_PEAK', 'FLASH', 'REQUEST_ONLY']),
  visibility: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'FREE_FOR_ALL']).default('PUBLIC'),
  benefitType: z.enum(['PERCENT', 'FIXED_AMOUNT', 'FIXED_PRICE', 'FREE_ITEM', 'BUNDLE']),
  benefitValue: z.number().positive(),
  currency: z.string().default('RUB'),
  minOrderAmount: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  termsText: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  redemptionChannel: z.enum(['IN_STORE', 'ONLINE', 'BOTH']).default('IN_STORE'),
  onlineUrl: z.string().url().optional(),
  promoCode: z.string().max(100).optional(),
  schedules: z.array(z.object({
    weekday: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })).optional(),
  blackoutDates: z.array(z.object({
    date: z.string().datetime(),
    reason: z.string().optional(),
  })).optional(),
  rules: z.array(z.object({
    ruleType: z.enum(['FIRST_TIME_ONLY', 'ONCE_PER_DAY', 'ONCE_PER_WEEK', 'ONCE_PER_MONTH', 'ONCE_PER_LIFETIME', 'MIN_CHECK', 'GEO_RADIUS', 'EXCLUDED_CATEGORIES', 'ALLOWED_CATEGORIES', 'MIN_PARTY_SIZE']),
    operator: z.string().optional(),
    value: z.unknown(),
  })).optional(),
  limits: z.object({
    dailyLimit: z.number().int().positive().optional(),
    weeklyLimit: z.number().int().positive().optional(),
    monthlyLimit: z.number().int().positive().optional(),
    totalLimit: z.number().int().positive().optional(),
    perUserDailyLimit: z.number().int().positive().optional(),
    perUserWeeklyLimit: z.number().int().positive().optional(),
    perUserLifetimeLimit: z.number().int().positive().optional(),
  }).optional(),
})

export const updateOfferSchema = createOfferSchema.partial().omit({ merchantId: true, branchId: true })

export const submitOfferSchema = z.object({ offerId: z.string().min(1) })
