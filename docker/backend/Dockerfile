FROM node:20.16.0-alpine3.19 AS builder

WORKDIR /app

#copy
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY turbo.json turbo.json
COPY packages packages
COPY backend backend

#gimme pnpm
RUN npm i -g pnpm

#build
RUN pnpm i --frozen-lockfile
RUN npm run build

#deploy (install all non-dev dependencies in a single node_module folder)
RUN pnpm deploy --filter backend --prod /prod/backend

## target image
FROM node:20.16.0-alpine3.19

##install wget, used by the applyConfig script
RUN apk add wget

# COPY to target
COPY --from=builder /prod/backend/node_modules /app/backend/node_modules
COPY --from=builder /prod/backend/dist /app/backend/dist
COPY --from=builder /prod/backend/email-templates /app/backend/email-templates
COPY --from=builder /prod/backend/redis-scripts /app/backend/redis-scripts

## to build directory
WORKDIR /app/backend/dist

## logs 
RUN mkdir logs

COPY docker/backend/entry-point.sh entry-point.sh
COPY docker/backend/applyConfig.sh applyConfig.sh

#run in env mode (no anticheat)
ENV MODE=dev

EXPOSE 5005
USER node

CMD [ "/bin/sh", "./entry-point.sh" ]
