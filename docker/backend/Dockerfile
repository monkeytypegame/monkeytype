FROM node:18.19.1-alpine3.19 as builder
WORKDIR /app

#copy
COPY .eslintignore .eslintignore
COPY .eslintrc.json .eslintrc.json
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY shared-types shared-types
COPY backend backend

#build
RUN npm ci
RUN cd backend && npm ci
RUN cd backend && npm run build

# target
FROM node:18.19.1-alpine3.19
RUN apk add wget
WORKDIR /
COPY backend/redis-scripts /redis-scripts

WORKDIR /app
COPY backend/package.json package.json
COPY backend/package-lock.json package-lock.json
COPY docker/backend/entry-point.sh entry-point.sh
COPY docker/backend/applyConfig.sh applyConfig.sh
COPY --from=builder /app/backend/build .

#install deps (no dev-dependencies)
RUN npm ci --omit=dev


## logs 
RUN mkdir logs

#run in env mode (no anticheat)
ENV MODE=dev


EXPOSE 5005
USER node

CMD [ "/bin/sh", "./entry-point.sh" ]