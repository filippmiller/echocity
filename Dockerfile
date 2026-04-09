FROM node:22-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json* ./

# Install ALL deps including devDeps for build (Coolify injects NODE_ENV=production which skips devDeps)
RUN NODE_ENV=development npm ci

COPY . .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
# SESSION_SECRET and NEXTAUTH_SECRET are needed at build time for Next.js page data collection
ENV SESSION_SECRET=build-time-placeholder
ENV NEXTAUTH_SECRET=build-time-placeholder
RUN npm run build
ENV SESSION_SECRET=
ENV NEXTAUTH_SECRET=

RUN addgroup -S app && adduser -S -G app app
RUN chown -R app:app /app

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER app

# Boot sequence (fixes schema drift from 2026-04-09 migration squash):
# 1. Mark 0_init as applied in _prisma_migrations (clears P3009 failed state).
#    Pre-existing tables from the old non-squashed schema stay in place.
# 2. prisma db push — reconciles the existing tables with schema.prisma, adding any
#    columns present in the schema but missing in the DB (e.g. Offer.metadata JSONB).
#    --accept-data-loss allows non-destructive column additions; it would only drop
#    data if the schema deleted a column, which is not the case here after a squash.
#    --skip-generate because generate already ran at build time.
# 3. Start Next.js.
# Once the DB is in sync, a single-commit cleanup can drop the resolve + db push steps
# and go back to plain `prisma migrate deploy && npm start`.
CMD ["sh", "-c", "(npx prisma migrate resolve --applied 0_init || true) && npx prisma db push --accept-data-loss --skip-generate && npm start"]
