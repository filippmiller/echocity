import cron from 'node-cron'
import { expireOffers, activateScheduledOffers } from '@/modules/offers/service'
import { expireSessions } from '@/modules/redemptions/service'
import { expireSubscriptions } from '@/modules/subscriptions/service'
import { logger } from '@/lib/logger'

let initialized = false

export function initCronJobs() {
  if (initialized || process.env.NODE_ENV === 'test') return
  initialized = true

  // Every minute: expire redemption sessions
  cron.schedule('* * * * *', async () => {
    try {
      const count = await expireSessions()
      if (count > 0) logger.info(`Expired ${count} redemption sessions`)
    } catch (e) { logger.error('Cron expireSessions failed', { error: String(e) }) }
  })

  // Every 5 minutes: activate scheduled offers
  cron.schedule('*/5 * * * *', async () => {
    try {
      const count = await activateScheduledOffers()
      if (count > 0) logger.info(`Activated ${count} scheduled offers`)
    } catch (e) { logger.error('Cron activateScheduledOffers failed', { error: String(e) }) }
  })

  // Every hour: expire past-endAt offers
  cron.schedule('0 * * * *', async () => {
    try {
      const count = await expireOffers()
      if (count > 0) logger.info(`Expired ${count} offers`)
    } catch (e) { logger.error('Cron expireOffers failed', { error: String(e) }) }
  })

  // Daily at 3am: expire subscriptions
  cron.schedule('0 3 * * *', async () => {
    try {
      const count = await expireSubscriptions()
      if (count > 0) logger.info(`Expired ${count} subscriptions`)
    } catch (e) { logger.error('Cron expireSubscriptions failed', { error: String(e) }) }
  })

  logger.info('Cron jobs initialized')
}
