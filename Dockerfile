# One service: NestJS serves /api and the React build (docs/08-DEPLOYMENT.md).
FROM node:22-slim AS build
WORKDIR /app
ENV CI=true \
    # Tests-only dependency: never download a mongod binary in the image.
    MONGOMS_DISABLE_POSTINSTALL=1
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build \
 && rm -rf node_modules apps/*/node_modules packages/*/node_modules \
 && pnpm install --frozen-lockfile --prod

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
# Pruned tree: prod node_modules + built dist folders (sources are tiny, kept for simplicity).
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/api/dist/main.js"]
