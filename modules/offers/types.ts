import type { Offer, OfferSchedule, OfferRule, OfferLimit, OfferBlackoutDate } from '@prisma/client'

export type OfferWithDetails = Offer & {
  schedules: OfferSchedule[]
  rules: OfferRule[]
  limits: OfferLimit | null
  blackoutDates: OfferBlackoutDate[]
  branch: { id: string; title: string; address: string; city: string; lat: number | null; lng: number | null }
  merchant: { id: string; name: string }
}

export type OfferCard = {
  id: string
  title: string
  subtitle: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  imageUrl: string | null
  branchName: string
  branchAddress: string
  branchCity: string
  distance?: number
  isActive: boolean
  currentlyValid: boolean
}

export type CreateOfferInput = {
  merchantId: string
  branchId: string
  title: string
  subtitle?: string
  description?: string
  offerType: string
  visibility?: string
  benefitType: string
  benefitValue: number
  currency?: string
  minOrderAmount?: number
  maxDiscountAmount?: number
  startAt: string
  endAt?: string
  termsText?: string
  imageUrl?: string
  schedules?: Array<{ weekday: number; startTime: string; endTime: string }>
  blackoutDates?: Array<{ date: string; reason?: string }>
  rules?: Array<{ ruleType: string; operator?: string; value?: unknown }>
  limits?: {
    dailyLimit?: number
    weeklyLimit?: number
    monthlyLimit?: number
    totalLimit?: number
    perUserDailyLimit?: number
    perUserWeeklyLimit?: number
    perUserLifetimeLimit?: number
  }
}

export type OfferValidationResult = {
  valid: boolean
  errorCode?: string
  errorMessage?: string
}
