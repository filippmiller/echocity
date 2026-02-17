FROM node:22-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
