/**
 * Mini app platform detection and bridge utilities.
 * Detects whether the app is running inside Max, VK, or standalone web.
 */

export type MiniAppPlatform = 'max' | 'vk' | 'web'

/**
 * Detect the current platform (client-side only).
 */
export function detectPlatform(): MiniAppPlatform {
  if (typeof window === 'undefined') return 'web'

  // Max detection: MAX Bridge is injected by the Max messenger
  if ((window as any).MaxBridge || (window as any).maxBridge) return 'max'

  // VK detection: vkBridge is injected by VK Mini Apps or URL has vk_app_id
  if ((window as any).vkBridge) return 'vk'
  if (typeof location !== 'undefined' && location.search.includes('vk_app_id=')) return 'vk'

  return 'web'
}

/**
 * Check if running inside any mini app environment.
 */
export function isInsideMiniApp(): boolean {
  return detectPlatform() !== 'web'
}
