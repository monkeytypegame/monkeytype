
FROM node:20.16.0-alpine3.19

##install wget, used by the applyConfig script
RUN apk add wget
WORKDIR /app

#copy
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY turbo.json turbo.json
COPY packages packages
COPY backend backend

#gimme pnpm
RUN npm i -g pnpm

#build, install with filter backend and root
RUN pnpm i
RUN npm run build

#remove dev dependencies
RUN pnpm i --filter backend
RUN pnpm prune --prod

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
