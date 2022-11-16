FROM node:16.13.2-bullseye

WORKDIR /app
COPY . .

RUN npm run install-all
