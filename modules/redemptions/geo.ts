const EARTH_RADIUS_METERS = 6_371_000

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate the distance between two lat/lng points using the Haversine formula.
 * Returns validity against a max radius and the actual distance in meters.
 */
export function validateGeoProximity(
  userLat: number,
  userLng: number,
  placeLat: number,
  placeLng: number,
  maxRadiusMeters: number
): { valid: boolean; distanceMeters: number } {
  const dLat = toRadians(placeLat - userLat)
  const dLng = toRadians(placeLng - userLng)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(userLat)) *
      Math.cos(toRadians(placeLat)) *
      Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distanceMeters = Math.round(EARTH_RADIUS_METERS * c)

  return {
    valid: distanceMeters <= maxRadiusMeters,
    distanceMeters,
  }
}
