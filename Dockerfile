FROM node:20-alpine AS dev-deps-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS prod-deps-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=dev-deps-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:20-alpine AS runner
COPY ./package.json package-lock.json /app/
COPY --from=prod-deps-env /app/node_modules /app/node_modules
COPY --from=build-env /app/dist /app/dist
COPY --from=dev-deps-env /app/.env /app/.env
WORKDIR /app
CMD ["node", "dist/main"]
