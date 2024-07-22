
FROM node:18.20.4-alpine3.19

##install wget, used by the applyConfig script
RUN apk add wget
WORKDIR /app

#copy
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY turbo.json turbo.json
COPY packages packages
COPY backend backend

#build
RUN npm ci
RUN npm run build

## remove dev dependencies
RUN npm install --install-strategy=nested --omit=dev --workspace=backend --ignore-scripts

## to build directory
WORKDIR /app/backend/build

## logs 
RUN mkdir logs

COPY docker/backend/entry-point.sh entry-point.sh
COPY docker/backend/applyConfig.sh applyConfig.sh

#run in env mode (no anticheat)
ENV MODE=dev

EXPOSE 5005
USER node

CMD [ "/bin/sh", "./entry-point.sh" ]
