import type { BusinessAccessLevel } from '@/lib/business-access'

export function canManageOffers(access: BusinessAccessLevel): boolean {
  return access === 'owner' || access === 'manager'
}

export function canManagePlaces(access: BusinessAccessLevel): boolean {
  return access === 'owner' || access === 'manager'
}

export function canManageStaff(access: BusinessAccessLevel): boolean {
  return access === 'owner' || access === 'manager'
}

export function canViewAnalytics(access: BusinessAccessLevel): boolean {
  return access === 'owner' || access === 'manager'
}

export function canScanRedemptions(access: BusinessAccessLevel): boolean {
  return access === 'owner' || access === 'manager' || access === 'cashier'
}

export function canRedeem(access: BusinessAccessLevel): boolean {
  return canScanRedemptions(access)
}
