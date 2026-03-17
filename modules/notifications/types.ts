/**
 * Push notification types and payload interfaces.
 */

export enum NotificationType {
  /** A deal is available near the user's current location */
  NEARBY_DEAL = 'NEARBY_DEAL',
  /** A place the user has favorited published a new offer */
  FAVORITE_PLACE_NEW_OFFER = 'FAVORITE_PLACE_NEW_OFFER',
  /** A limited-time flash deal is live */
  FLASH_DEAL = 'FLASH_DEAL',
  /** Reminder that a saved/redeemed offer is about to expire */
  EXPIRY_REMINDER = 'EXPIRY_REMINDER',
  /** Weekly summary of deals and savings */
  WEEKLY_DIGEST = 'WEEKLY_DIGEST',
  /** Monthly or periodic savings report */
  SAVINGS_REPORT = 'SAVINGS_REPORT',
}

export interface NotificationPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  type?: NotificationType
  actions?: Array<{ action: string; title: string }>
  data?: Record<string, unknown>
}

export interface PushSubscriptionKeys {
  p256dh: string
  auth: string
}

export interface PushSubscriptionInput {
  endpoint: string
  keys: PushSubscriptionKeys
}
