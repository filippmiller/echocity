export type PlanInfo = {
  id: string
  code: string
  name: string
  monthlyPrice: number
  features: Record<string, unknown>
  trialDays: number
}

export type UserSubscriptionStatus = {
  isSubscribed: boolean
  planCode: string | null
  status: string | null
  endAt: Date | null
}
