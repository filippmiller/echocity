FROM node:22-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json* ./

# Install ALL deps including devDeps for build (Coolify injects NODE_ENV=production which skips devDeps)
RUN NODE_ENV=development npm ci

COPY . .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

RUN addgroup -S app && adduser -S -G app app
RUN chown -R app:app /app

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER app

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
