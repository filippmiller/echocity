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

# Resolve any previously-failed migrations (idempotent — harmless if already applied).
# Fixes P3009 loop after migration squash in d24f159. The 0_init schema IS applied to
# the DB; only the _prisma_migrations tracker row is in a failed state.
CMD ["sh", "-c", "(npx prisma migrate resolve --applied 0_init || true) && npx prisma migrate deploy && npm start"]
