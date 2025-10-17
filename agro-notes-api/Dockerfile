FROM node:20-alpine AS base
WORKDIR /app


# Dependencias
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund


# Build
FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build


# Runtime
FROM base AS prod
ENV NODE_ENV=production
# App envs en runtime (sobre-escribir con -e/compose)
ENV PORT=4000
EXPOSE 4000
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
CMD ["node", "dist/main.js"]