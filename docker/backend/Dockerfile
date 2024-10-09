FROM node:20.16.0-alpine3.19 AS builder

WORKDIR /app

#copy
COPY ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "turbo.json", "./"]
COPY packages packages
COPY backend backend

#gimme pnpm + build
RUN npm i -g pnpm && \
    pnpm i --frozen-lockfile && \
    npm run build

#deploy (install all non-dev dependencies in a single node_module folder)
RUN pnpm deploy --filter backend --prod /prod/backend

#---------------------------------

## target image
FROM node:20.16.0-alpine3.19

##install wget, used by the applyConfig script
RUN apk update --no-cache && \
    apk add --no-cache wget

# COPY to target
COPY --from=builder /prod/backend/node_modules /app/backend/node_modules
COPY --from=builder /prod/backend/dist /app/backend/dist
COPY --from=builder /prod/backend/email-templates /app/backend/email-templates
COPY --from=builder /prod/backend/redis-scripts /app/backend/redis-scripts

## to build directory
WORKDIR /app/backend/dist

## logs 
RUN mkdir -p /app/backend/dist/logs

COPY ["docker/backend/entry-point.sh", "docker/backend/applyConfig.sh", "./"]

#run in env mode (no anticheat)
ENV MODE=dev

EXPOSE 5005
USER node

CMD [ "/bin/sh", "./entry-point.sh" ]
