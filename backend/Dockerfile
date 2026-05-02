# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

# Generate Prisma client
COPY src/prisma/schema.prisma ./prisma/schema.prisma
RUN npx prisma generate

# Production stage
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 boardify

WORKDIR /app

COPY --from=builder --chown=boardify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=boardify:nodejs /app/src ./src
COPY --chown=boardify:nodejs package*.json ./

USER boardify

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]
