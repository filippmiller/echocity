import { prisma } from '@/lib/prisma'

/**
 * Typed registry of feature flags used to gate risky or unfinished
 * consumer and business features. Unknown keys always fail closed.
 */
export const FEATURE_FLAGS = [
  'ENABLE_BUNDLE_EXPERIMENT',
  'ENABLE_MYSTERY_BAGS',
  'ENABLE_GROUP_DEALS',
  'ENABLE_DEMAND_RESPONSES',
  'ENABLE_STORIES',
  'ENABLE_CORPORATE_PLANS',
] as const

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[number]

const FEATURE_FLAG_KEYS = new Set<string>(FEATURE_FLAGS)

export interface FeatureFlagValue {
  key: FeatureFlagKey
  enabled: boolean
  description: string
  allowedRoles: string[]
}

export interface FeatureFlagPublicValue {
  key: FeatureFlagKey
  enabled: boolean
  description: string
}

function isFeatureFlagKey(key: string): key is FeatureFlagKey {
  return FEATURE_FLAG_KEYS.has(key)
}

function parseEnvOverride(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
    return true
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
    return false
  }
  return undefined
}

function envVarName(key: FeatureFlagKey): string {
  return `FEATURE_FLAG_${key}`
}

function defaultFlag(key: FeatureFlagKey): FeatureFlagValue {
  switch (key) {
    case 'ENABLE_BUNDLE_EXPERIMENT':
      return {
        key,
        enabled: false,
        description: 'Cross-merchant bundle offers (consumer/business).',
        allowedRoles: [],
      }
    case 'ENABLE_MYSTERY_BAGS':
      return {
        key,
        enabled: false,
        description: 'Mystery bag / surprise box offers.',
        allowedRoles: [],
      }
    case 'ENABLE_GROUP_DEALS':
      return {
        key,
        enabled: false,
        description: '"Пойдём вместе" group deal offers.',
        allowedRoles: [],
      }
    case 'ENABLE_DEMAND_RESPONSES':
      return {
        key,
        enabled: false,
        description: 'Merchant responses to consumer demand requests.',
        allowedRoles: [],
      }
    case 'ENABLE_STORIES':
      return {
        key,
        enabled: false,
        description: 'Merchant stories / ephemeral content.',
        allowedRoles: [],
      }
    case 'ENABLE_CORPORATE_PLANS':
      return {
        key,
        enabled: false,
        description: 'Corporate B2B subscription plans.',
        allowedRoles: [],
      }
    default:
      return {
        key,
        enabled: false,
        description: '',
        allowedRoles: [],
      }
  }
}

/**
 * Resolve a single feature flag, in precedence order:
 * 1. process.env override (FEATURE_FLAG_<KEY>)
 * 2. database FeatureFlag row
 * 3. conservative default (false)
 *
 * Unknown keys fail closed (enabled=false).
 */
export async function getFeatureFlag(key: string): Promise<FeatureFlagValue> {
  if (!isFeatureFlagKey(key)) {
    return {
      key: key as FeatureFlagKey,
      enabled: false,
      description: '',
      allowedRoles: [],
    }
  }

  const base = defaultFlag(key)

  const envOverride = parseEnvOverride(process.env[envVarName(key)])
  if (envOverride !== undefined) {
    return { ...base, enabled: envOverride }
  }

  try {
    const row = await prisma.featureFlag.findUnique({ where: { key } })
    if (row) {
      return {
        key,
        enabled: row.enabled,
        description: row.description ?? base.description,
        allowedRoles: row.allowedRoles,
      }
    }
  } catch {
    // Fail closed on database errors.
  }

  return base
}

/**
 * Resolve all known feature flags. Unknown keys are ignored.
 */
export async function getAllFeatureFlags(): Promise<FeatureFlagValue[]> {
  const envOverrides = new Map<FeatureFlagKey, boolean>()
  for (const key of FEATURE_FLAGS) {
    const override = parseEnvOverride(process.env[envVarName(key)])
    if (override !== undefined) {
      envOverrides.set(key, override)
    }
  }

  let rows: Array<{
    key: string
    enabled: boolean
    description: string | null
    allowedRoles: string[]
  }> = []

  try {
    rows = await prisma.featureFlag.findMany({
      where: { key: { in: FEATURE_FLAGS as unknown as string[] } },
    })
  } catch {
    // Fail closed on database errors: return defaults below.
  }

  const rowMap = new Map(rows.map((r) => [r.key, r]))

  return FEATURE_FLAGS.map((key) => {
    const base = defaultFlag(key)
    const row = rowMap.get(key)

    if (envOverrides.has(key)) {
      return { ...base, enabled: envOverrides.get(key)! }
    }

    if (row) {
      return {
        key,
        enabled: row.enabled,
        description: row.description ?? base.description,
        allowedRoles: row.allowedRoles,
      }
    }

    return base
  })
}

/**
 * Public-safe subset of flags (no internal metadata).
 */
export async function getPublicFeatureFlags(): Promise<FeatureFlagPublicValue[]> {
  const all = await getAllFeatureFlags()
  return all.map(({ key, enabled, description }) => ({ key, enabled, description }))
}
