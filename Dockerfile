# Stage 1: Build the app
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client and build Remix SSR + client assets
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# Stage 2: Production runner
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Ensure persistent storage directory exists for SQLite
RUN mkdir -p /data && chmod 777 /data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Automatically push database schema on startup before starting Remix SSR
CMD ["npm", "run", "start:prod"]
