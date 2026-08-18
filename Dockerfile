# =========================
# Stage 1: Build React frontend
# =========================
FROM node:20-bookworm-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ ./

RUN npm run build


# =========================
# Stage 2: Backend
# =========================
FROM node:20-bookworm-slim

WORKDIR /app

COPY backend/package*.json ./backend/

WORKDIR /app/backend

RUN npm install --omit=dev

COPY backend/ ./

COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 5000

CMD ["node", "server.js"]