export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initCronJobs } = await import('@/lib/cron')
    initCronJobs()

    // Seed gamification data (idempotent upserts)
    const { seedMissionsAndBadges } = await import('@/modules/gamification/seed-missions')
    seedMissionsAndBadges().catch((e) => {
      console.error('Failed to seed missions/badges:', e)
    })
  }
}
