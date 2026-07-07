import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN
const release = process.env.NEXT_PUBLIC_BUILD_SHA || process.env.BUILD_SHA || 'dev'
const environment = process.env.NODE_ENV || 'development'

if (dsn) {
  Sentry.init({
    dsn,
    release,
    environment,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
  })
}
