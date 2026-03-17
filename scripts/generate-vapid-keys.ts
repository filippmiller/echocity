/**
 * Generate VAPID key pair for Web Push notifications.
 *
 * Usage:
 *   npx tsx scripts/generate-vapid-keys.ts
 *
 * Copy the output into your .env file.
 *
 * DEPENDENCY: `web-push` must be installed.
 */

import webpush from 'web-push'

const vapidKeys = webpush.generateVAPIDKeys()

console.log('=== VAPID Keys Generated ===\n')
console.log('Add these to your .env file:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`)
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`)
console.log(`VAPID_SUBJECT="mailto:support@gdesejchas.ru"`)
console.log('\n============================')
