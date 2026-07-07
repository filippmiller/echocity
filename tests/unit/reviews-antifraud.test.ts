import { describe, expect, it } from 'vitest'
import {
  getAllowedStoragePrefixes,
  hasRecentReview,
  isOwnStorageUrl,
} from '@/lib/reviews'

describe('reviews antifraud helpers', () => {
  describe('photo URL validation', () => {
    const prefixes = [
      'https://minio.example.com/cityecho-photos',
      'https://abc.supabase.co/storage/v1/object/public/user-photos',
    ]

    it('accepts own MinIO URLs', () => {
      const url = 'https://minio.example.com/cityecho-photos/reviews/user-1/photo.jpg'
      expect(isOwnStorageUrl(url, prefixes)).toBe(true)
    })

    it('accepts own Supabase URLs', () => {
      const url =
        'https://abc.supabase.co/storage/v1/object/public/user-photos/reviews/user-1/photo.png'
      expect(isOwnStorageUrl(url, prefixes)).toBe(true)
    })

    it('rejects external URLs', () => {
      expect(isOwnStorageUrl('https://evil.com/reviews/user-1/photo.jpg', prefixes)).toBe(false)
      expect(isOwnStorageUrl('https://example.com/image.png', prefixes)).toBe(false)
    })

    it('rejects empty or non-URL strings', () => {
      expect(isOwnStorageUrl('', prefixes)).toBe(false)
      expect(isOwnStorageUrl('javascript:alert(1)', prefixes)).toBe(false)
    })

    it('returns false when no prefixes are configured', () => {
      expect(isOwnStorageUrl('https://minio.example.com/photo.jpg', [])).toBe(false)
    })

    it('trims trailing slashes from env prefixes', () => {
      process.env.MINIO_PUBLIC_BASE_URL = 'https://minio.example.com/cityecho-photos/'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co/'

      const got = getAllowedStoragePrefixes()
      expect(got.every((prefix) => !prefix.endsWith('/'))).toBe(true)
      expect(got).toContain('https://minio.example.com/cityecho-photos')
      expect(got).toContain('https://abc.supabase.co')
    })
  })

  describe('24h rate limit', () => {
    const now = new Date('2026-07-07T12:00:00.000Z')

    it('allows when no previous review exists', () => {
      expect(hasRecentReview(null, now)).toBe(false)
      expect(hasRecentReview(undefined, now)).toBe(false)
    })

    it('blocks a review created within the last 24 hours', () => {
      const latest = { createdAt: new Date('2026-07-06T12:01:00.000Z') }
      expect(hasRecentReview(latest, now)).toBe(true)
    })

    it('blocks a review created 1 hour ago', () => {
      const latest = { createdAt: new Date('2026-07-07T11:00:00.000Z') }
      expect(hasRecentReview(latest, now)).toBe(true)
    })

    it('allows a review created exactly 24 hours ago', () => {
      const latest = { createdAt: new Date('2026-07-06T12:00:00.000Z') }
      expect(hasRecentReview(latest, now)).toBe(false)
    })

    it('allows a review created more than 24 hours ago', () => {
      const latest = { createdAt: new Date('2026-07-05T12:00:00.000Z') }
      expect(hasRecentReview(latest, now)).toBe(false)
    })
  })
})
