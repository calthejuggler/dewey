ARG BUN_VERSION=1.1.42

FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /usr/src/app

FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM deps AS test
COPY . .
RUN bun check

FROM deps AS build
COPY . .
ENV NODE_ENV=production
RUN bun build --compile --minify --sourcemap src/index.ts --outfile dewey

FROM base AS release

COPY --from=build /usr/src/app/dewey /usr/src/app/dewey

USER bun

ENTRYPOINT ["/usr/src/app/dewey"]

