ARG BUN_VERSION=1.1.42

FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/prod/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun build --compile --minify --sourcemap src/index.ts --outfile dewey

FROM base AS release
COPY --from=prerelease /usr/src/app/dewey .

USER bun
ENTRYPOINT [ "/usr/src/app/dewey" ]
