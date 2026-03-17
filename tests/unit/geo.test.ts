import { describe, it, expect } from 'vitest'
import { validateGeoProximity } from '@/modules/redemptions/geo'

describe('redemptions/geo — validateGeoProximity', () => {
  describe('same point → 0 distance', () => {
    it('returns 0 meters for identical coordinates', () => {
      const result = validateGeoProximity(55.7558, 37.6173, 55.7558, 37.6173, 100)
      expect(result.distanceMeters).toBe(0)
      expect(result.valid).toBe(true)
    })

    it('returns 0 meters at the equator', () => {
      const result = validateGeoProximity(0, 0, 0, 0, 1)
      expect(result.distanceMeters).toBe(0)
      expect(result.valid).toBe(true)
    })
  })

  describe('known distances', () => {
    it('Moscow to Saint Petersburg ≈ 634 km', () => {
      // Moscow: 55.7558° N, 37.6173° E
      // Saint Petersburg: 59.9343° N, 30.3351° E
      const result = validateGeoProximity(55.7558, 37.6173, 59.9343, 30.3351, 1_000_000)

      // The actual distance is approximately 634 km.
      // Allow a tolerance of ±20 km for Haversine approximation.
      expect(result.distanceMeters).toBeGreaterThan(614_000)
      expect(result.distanceMeters).toBeLessThan(654_000)
      expect(result.valid).toBe(true)
    })

    it('Moscow to Novosibirsk ≈ 2811 km', () => {
      // Novosibirsk: 55.0084° N, 82.9357° E
      const result = validateGeoProximity(55.7558, 37.6173, 55.0084, 82.9357, 5_000_000)

      expect(result.distanceMeters).toBeGreaterThan(2_780_000)
      expect(result.distanceMeters).toBeLessThan(2_840_000)
      expect(result.valid).toBe(true)
    })
  })

  describe('within radius → valid', () => {
    it('returns valid when distance is exactly at the boundary', () => {
      // Two points ~111 km apart (1 degree latitude at equator)
      const result = validateGeoProximity(0, 0, 1, 0, 200_000)
      expect(result.valid).toBe(true)
      // ~111 km which is within 200 km
      expect(result.distanceMeters).toBeGreaterThan(100_000)
      expect(result.distanceMeters).toBeLessThan(120_000)
    })

    it('returns valid for nearby points within 100m radius', () => {
      // Two points ~50m apart (roughly 0.00045 degrees of latitude)
      const result = validateGeoProximity(55.7558, 37.6173, 55.75625, 37.6173, 100)
      expect(result.valid).toBe(true)
      expect(result.distanceMeters).toBeLessThanOrEqual(100)
    })
  })

  describe('outside radius → invalid', () => {
    it('returns invalid when distance exceeds radius', () => {
      // Moscow to SPB with a 100km radius
      const result = validateGeoProximity(55.7558, 37.6173, 59.9343, 30.3351, 100_000)
      expect(result.valid).toBe(false)
      expect(result.distanceMeters).toBeGreaterThan(100_000)
    })

    it('returns invalid for points 1km apart with 500m radius', () => {
      // Roughly 0.009 degrees of latitude ≈ 1 km
      const result = validateGeoProximity(55.7558, 37.6173, 55.7648, 37.6173, 500)
      expect(result.valid).toBe(false)
      expect(result.distanceMeters).toBeGreaterThan(500)
    })
  })

  describe('edge cases', () => {
    it('handles negative coordinates (southern/western hemisphere)', () => {
      // Rio de Janeiro: -22.9068° S, -43.1729° W
      // Buenos Aires: -34.6037° S, -58.3816° W
      const result = validateGeoProximity(-22.9068, -43.1729, -34.6037, -58.3816, 5_000_000)
      expect(result.valid).toBe(true)
      // ~1968 km apart
      expect(result.distanceMeters).toBeGreaterThan(1_900_000)
      expect(result.distanceMeters).toBeLessThan(2_050_000)
    })

    it('handles crossing the prime meridian', () => {
      // London: 51.5074° N, -0.1278° W
      // Paris: 48.8566° N, 2.3522° E
      const result = validateGeoProximity(51.5074, -0.1278, 48.8566, 2.3522, 500_000)
      expect(result.valid).toBe(true)
      // ~340 km
      expect(result.distanceMeters).toBeGreaterThan(320_000)
      expect(result.distanceMeters).toBeLessThan(360_000)
    })

    it('handles zero radius — only same point is valid', () => {
      const result = validateGeoProximity(55.7558, 37.6173, 55.7558, 37.6173, 0)
      expect(result.distanceMeters).toBe(0)
      expect(result.valid).toBe(true)
    })

    it('returns rounded integer meters', () => {
      const result = validateGeoProximity(55.7558, 37.6173, 55.756, 37.618, 1000)
      expect(Number.isInteger(result.distanceMeters)).toBe(true)
    })
  })
})
