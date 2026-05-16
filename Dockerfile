# Multi-stage Dockerfile для Next.js + SQLite

# ─── Stage 1: Зависимости ─────────────────────────────────────────────
FROM node:20-slim AS deps

# Устанавливаем build tools для нативных модулей (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci

# ─── Stage 2: Сборка ──────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── Stage 3: Production ──────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Копируем standalone сборку Next.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Копируем БД если она уже существует (иначе создастся при первом запуске)
COPY --from=builder /app/db.sqlite ./db.sqlite 2>/dev/null || true

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
