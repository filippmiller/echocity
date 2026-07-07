export interface RiskScoreOffer {
  description?: string | null
  imageUrl?: string | null
  benefitType: string
  benefitValue: number | bigint | { toNumber(): number }
  startAt: Date
  endAt?: Date | null
}

export interface RiskScoreBusiness {
  status: string
  createdAt: Date
}

export interface RiskScoreComplaint {
  status: string
}

export interface RiskScoreFraudFlag {
  status: string
}

export interface RiskScoreResult {
  score: number
  reasons: string[]
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS

function toNumber(value: number | bigint | { toNumber(): number }): number {
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'number') return value
  return value.toNumber()
}

export function calculateRiskScore(
  offer: RiskScoreOffer,
  business: RiskScoreBusiness,
  complaints: RiskScoreComplaint[],
  fraudFlags: RiskScoreFraudFlag[],
): RiskScoreResult {
  let score = 0
  const reasons: string[] = []

  if (!offer.imageUrl || offer.imageUrl.trim().length === 0) {
    score += 15
    reasons.push('Missing offer image')
  }

  if (!offer.description || offer.description.trim().length === 0) {
    score += 10
    reasons.push('Missing offer description')
  }

  if (offer.benefitType === 'PERCENT') {
    const discountPercent = toNumber(offer.benefitValue)
    if (discountPercent > 90) {
      score += 20
      reasons.push(`Discount percent (${discountPercent}%) exceeds 90%`)
    }
  }

  if (business.status === 'PENDING') {
    score += 15
    reasons.push('Business approval status is PENDING')
  }

  const activeComplaints = complaints.filter((c) => c.status === 'OPEN' || c.status === 'IN_REVIEW')
  if (activeComplaints.length > 0) {
    const complaintScore = Math.min(activeComplaints.length * 10, 20)
    score += complaintScore
    reasons.push(`${activeComplaints.length} active complaint(s)`)
  }

  const activeFlags = fraudFlags.filter((f) => f.status === 'OPEN')
  if (activeFlags.length > 0) {
    const flagScore = Math.min(activeFlags.length * 15, 30)
    score += flagScore
    reasons.push(`${activeFlags.length} active fraud flag(s)`)
  }

  if (offer.endAt) {
    const durationMs = offer.endAt.getTime() - offer.startAt.getTime()
    if (durationMs > 0 && durationMs < ONE_DAY_MS) {
      score += 10
      reasons.push('Offer duration is less than 24 hours')
    }
  }

  const businessAgeMs = Date.now() - business.createdAt.getTime()
  if (businessAgeMs >= 0 && businessAgeMs < SEVEN_DAYS_MS) {
    score += 10
    reasons.push('Business is less than 7 days old')
  }

  return {
    score: Math.min(100, score),
    reasons,
  }
}
