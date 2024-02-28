FROM node:hydrogen-alpine as builder
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
FROM node:hydrogen-alpine
WORKDIR /
COPY backend/redis-scripts /redis-scripts

WORKDIR /app
COPY backend/package.json package.json
COPY backend/package-lock.json package-lock.json
COPY --from=builder /app/backend/build .

#install deps (no dev-dependencies)
RUN npm ci --omit=dev

## logs 
RUN mkdir logs

#run in env mode (no anticheat)
ENV MODE=dev


EXPOSE 5005
USER node

CMD [ "node", "server.js" ]