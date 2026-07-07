FROM node:22-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

RUN addgroup -S app && adduser -S -G app app

COPY package.json package-lock.json* ./

# Install ALL deps including devDeps for build (Coolify injects NODE_ENV=production which skips devDeps)
RUN NODE_ENV=development npm ci

COPY --chown=app:app . .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
# SESSION_SECRET and NEXTAUTH_SECRET are needed at build time for Next.js page data collection
ENV SESSION_SECRET=build-time-placeholder
ENV NEXTAUTH_SECRET=build-time-placeholder
RUN npm run build
ENV SESSION_SECRET=
ENV NEXTAUTH_SECRET=

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER app

# Apply committed Prisma migrations and start Next.js.
# If production has legacy migration drift, reconcile it once using the
# documented operator procedure before deploying this image. Do not run
# `prisma db push --accept-data-loss` from application startup.
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
