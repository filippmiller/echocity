/**
 * Haptic feedback utilities using the Vibration API.
 * All calls are no-ops on devices that don't support vibration.
 */

/** Short tap — use for generic button presses */
export function hapticTap() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

/** Success pattern — use when an action completes successfully */
export function hapticSuccess() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([50, 30, 100])
  }
}

/** Error pattern — use when an action fails */
export function hapticError() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([100, 50, 100])
  }
}
