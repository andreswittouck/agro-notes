FROM node:20-alpine AS base
WORKDIR /app


FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund


FROM deps AS build
COPY tsconfig.json next.config.mjs ./
COPY src ./src
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


FROM base AS prod
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY package.json ./package.json
COPY next.config.mjs ./next.config.mjs
EXPOSE 3000
CMD ["npm", "run", "start"]