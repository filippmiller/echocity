import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPushNotification, mockSendEmail, mockEmailConfigured } = vi.hoisted(() => ({
  mockPushNotification: vi.fn(),
  mockSendEmail: vi.fn(),
  mockEmailConfigured: vi.fn(),
}))

vi.mock('@/modules/notifications/push', () => ({
  sendPushNotification: mockPushNotification,
}))

vi.mock('@/modules/email/resend', () => ({
  sendEmail: mockSendEmail,
  isEmailDeliveryConfigured: mockEmailConfigured,
}))

const {
  mockReminderLogFindMany,
  mockReminderLogCreate,
  mockReminderLogAggregate,
  mockOfferFindMany,
  mockOfferFindUnique,
  mockFavoriteFindMany,
  mockUserProfileFindUnique,
  mockUserFindUnique,
} = vi.hoisted(() => ({
  mockReminderLogFindMany: vi.fn(),
  mockReminderLogCreate: vi.fn(),
  mockReminderLogAggregate: vi.fn(),
  mockOfferFindMany: vi.fn(),
  mockOfferFindUnique: vi.fn(),
  mockFavoriteFindMany: vi.fn(),
  mockUserProfileFindUnique: vi.fn(),
  mockUserFindUnique: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    reminderLog: {
      findMany: mockReminderLogFindMany,
      create: mockReminderLogCreate,
      aggregate: mockReminderLogAggregate,
    },
    offer: {
      findMany: mockOfferFindMany,
      findUnique: mockOfferFindUnique,
    },
    favorite: {
      findMany: mockFavoriteFindMany,
    },
    userProfile: {
      findUnique: mockUserProfileFindUnique,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
  },
}))

import {
  findExpiringSavedOffers,
  resolveChannels,
  sendReminder,
  processExpiringOfferReminders,
  getReminderOpsStatus,
} from '@/modules/notifications/expiring-offer-reminders'

describe('modules/notifications/expiring-offer-reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEmailConfigured.mockReturnValue(true)
  })

  describe('findExpiringSavedOffers', () => {
    it('returns saved offers expiring within the window', async () => {
      const now = new Date()
      const offer = {
        id: 'offer-1',
        title: 'Скидка',
        endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        branch: { title: 'Кафе', city: 'Санкт-Петербург' },
        merchant: { name: 'Кафе' },
      }
      mockOfferFindMany.mockResolvedValue([offer])
      mockFavoriteFindMany.mockResolvedValue([{ userId: 'user-1', entityId: 'offer-1' }])
      mockReminderLogFindMany.mockResolvedValue([])

      const result = await findExpiringSavedOffers(24)

      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe('user-1')
      expect(result[0].offerId).toBe('offer-1')
      expect(result[0].offer.title).toBe('Скидка')
    })

    it('excludes offers already reminded in this window', async () => {
      const now = new Date()
      const offer = {
        id: 'offer-1',
        title: 'Скидка',
        endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        branch: { title: 'Кафе', city: 'Санкт-Петербург' },
        merchant: { name: 'Кафе' },
      }
      mockOfferFindMany.mockResolvedValue([offer])
      mockFavoriteFindMany.mockResolvedValue([
        { userId: 'user-1', entityId: 'offer-1' },
        { userId: 'user-2', entityId: 'offer-1' },
      ])
      mockReminderLogFindMany.mockResolvedValue([{ userId: 'user-1', offerId: 'offer-1' }])

      const result = await findExpiringSavedOffers(24)

      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe('user-2')
    })

    it('returns empty array when no expiring offers', async () => {
      mockOfferFindMany.mockResolvedValue([])
      const result = await findExpiringSavedOffers(24)
      expect(result).toHaveLength(0)
      expect(mockFavoriteFindMany).not.toHaveBeenCalled()
    })
  })

  describe('resolveChannels', () => {
    it('returns both channels when enabled', () => {
      const prefs = { notificationsEnabled: true, pushNotifications: true, emailNotifications: true }
      expect(resolveChannels(prefs, ['push', 'email'])).toEqual(['push', 'email'])
    })

    it('returns empty when notifications are disabled', () => {
      const prefs = { notificationsEnabled: false, pushNotifications: true, emailNotifications: true }
      expect(resolveChannels(prefs, ['push', 'email'])).toEqual([])
    })

    it('filters out disabled channels', () => {
      const prefs = { notificationsEnabled: true, pushNotifications: false, emailNotifications: true }
      expect(resolveChannels(prefs, ['push', 'email'])).toEqual(['email'])
    })
  })

  describe('sendReminder', () => {
    it('sends push and email when enabled and writes ReminderLog', async () => {
      const now = new Date()
      mockOfferFindUnique.mockResolvedValue({
        id: 'offer-1',
        title: 'Скидка',
        endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        branch: { title: 'Кафе', city: 'Санкт-Петербург' },
        merchant: { name: 'Кафе' },
      })
      mockUserProfileFindUnique.mockResolvedValue({
        notificationsEnabled: true,
        pushNotifications: true,
        emailNotifications: true,
      })
      mockUserFindUnique.mockResolvedValue({ email: 'user@example.com' })
      mockReminderLogCreate.mockResolvedValue({})

      const result = await sendReminder('user-1', 'offer-1', ['push', 'email'])

      expect(result.sent).toEqual(['push', 'email'])
      expect(result.skipped).toEqual([])
      expect(mockPushNotification).toHaveBeenCalledOnce()
      expect(mockSendEmail).toHaveBeenCalledOnce()
      expect(mockReminderLogCreate).toHaveBeenCalledTimes(2)
    })

    it('skips channels disabled by user preferences', async () => {
      const now = new Date()
      mockOfferFindUnique.mockResolvedValue({
        id: 'offer-1',
        title: 'Скидка',
        endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        branch: { title: 'Кафе', city: 'Санкт-Петербург' },
        merchant: { name: 'Кафе' },
      })
      mockUserProfileFindUnique.mockResolvedValue({
        notificationsEnabled: true,
        pushNotifications: true,
        emailNotifications: false,
      })
      mockUserFindUnique.mockResolvedValue({ email: 'user@example.com' })
      mockReminderLogCreate.mockResolvedValue({})

      const result = await sendReminder('user-1', 'offer-1', ['push', 'email'])

      expect(result.sent).toEqual(['push'])
      expect(result.skipped).toEqual(['email'])
      expect(mockPushNotification).toHaveBeenCalledOnce()
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('does nothing when offer is missing', async () => {
      mockOfferFindUnique.mockResolvedValue(null)
      const result = await sendReminder('user-1', 'offer-1')
      expect(result.sent).toEqual([])
      expect(result.skipped).toEqual(['push', 'email'])
      expect(mockPushNotification).not.toHaveBeenCalled()
    })
  })

  describe('processExpiringOfferReminders', () => {
    it('processes all detected reminders and returns total sent', async () => {
      const now = new Date()
      const offer = {
        id: 'offer-1',
        title: 'Скидка',
        endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        branch: { title: 'Кафе', city: 'Санкт-Петербург' },
        merchant: { name: 'Кафе' },
      }
      mockOfferFindMany.mockResolvedValue([offer])
      mockFavoriteFindMany.mockResolvedValue([
        { userId: 'user-1', entityId: 'offer-1' },
        { userId: 'user-2', entityId: 'offer-1' },
      ])
      mockReminderLogFindMany.mockResolvedValue([])
      mockOfferFindUnique.mockResolvedValue(offer)
      mockUserProfileFindUnique.mockResolvedValue({
        notificationsEnabled: true,
        pushNotifications: true,
        emailNotifications: false,
      })
      mockUserFindUnique.mockResolvedValue({ email: 'user@example.com' })
      mockReminderLogCreate.mockResolvedValue({})

      const count = await processExpiringOfferReminders(24)

      expect(count).toBe(2)
      expect(mockPushNotification).toHaveBeenCalledTimes(2)
    })

    it('continues batch when a single reminder fails unexpectedly', async () => {
      const now = new Date()
      const offer = {
        id: 'offer-1',
        title: 'Скидка',
        endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        branch: { title: 'Кафе', city: 'Санкт-Петербург' },
        merchant: { name: 'Кафе' },
      }
      mockOfferFindMany.mockResolvedValue([offer])
      mockFavoriteFindMany.mockResolvedValue([
        { userId: 'user-1', entityId: 'offer-1' },
        { userId: 'user-2', entityId: 'offer-1' },
      ])
      mockReminderLogFindMany.mockResolvedValue([])
      mockOfferFindUnique
        .mockRejectedValueOnce(new Error('DB boom'))
        .mockResolvedValue(offer)
      mockUserProfileFindUnique.mockResolvedValue({
        notificationsEnabled: true,
        pushNotifications: true,
        emailNotifications: false,
      })
      mockUserFindUnique.mockResolvedValue({ email: 'user@example.com' })
      mockReminderLogCreate.mockResolvedValue({})

      const count = await processExpiringOfferReminders(24)

      expect(count).toBe(1)
      expect(mockPushNotification).toHaveBeenCalledTimes(1)
    })
  })

  describe('getReminderOpsStatus', () => {
    it('returns the expected status shape', async () => {
      const now = new Date()
      const offer = {
        id: 'offer-1',
        title: 'Скидка',
        endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        branch: { title: 'Кафе', city: 'Санкт-Петербург' },
        merchant: { name: 'Кафе' },
      }
      mockOfferFindMany.mockResolvedValue([offer])
      mockFavoriteFindMany.mockResolvedValue([{ userId: 'user-1', entityId: 'offer-1' }])
      mockReminderLogFindMany.mockResolvedValue([])
      mockReminderLogAggregate.mockResolvedValue({ _max: { sentAt: now } })
      mockEmailConfigured.mockReturnValue(true)

      const status = await getReminderOpsStatus()

      expect(status).toEqual({
        pendingOffers: 1,
        lastRunAt: now,
        channelsConfigured: { push: false, email: true },
        isHealthy: true,
      })
    })

    it('is healthy when there are no pending offers even without channels', async () => {
      mockOfferFindMany.mockResolvedValue([])
      mockReminderLogAggregate.mockResolvedValue({ _max: { sentAt: null } })
      mockEmailConfigured.mockReturnValue(false)

      const status = await getReminderOpsStatus()

      expect(status.pendingOffers).toBe(0)
      expect(status.channelsConfigured).toEqual({ push: false, email: false })
      expect(status.isHealthy).toBe(true)
    })
  })
})
