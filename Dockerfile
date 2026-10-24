# ---- Etapa 1: compilar Angular en modo producción ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# ---- Etapa 2: servir con Caddy (HTTPS automático con Let's Encrypt) ----
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/frontend-barriodigital/browser /srv
EXPOSE 80 443
