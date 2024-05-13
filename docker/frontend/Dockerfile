FROM node:18.19.1-alpine3.19 as builder
WORKDIR /app

#ENV
ENV BACKEND_URL=###MONKEYTYPE_BACKENDURL###
ENV RECAPTCHA_SITE_KEY=###RECAPTCHA_SITE_KEY###

#COPY
COPY .eslintrc.json .eslintrc.json
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY shared-types shared-types
COPY frontend frontend
COPY docker/frontend/firebase-config-live.ts frontend/src/ts/constants/firebase-config.ts
COPY docker/frontend/firebase-config-live.ts frontend/src/ts/constants/firebase-config-live.ts

#BUILD
RUN npm ci
RUN cd frontend && npm ci
RUN cd frontend && npx vite build


# COPY to target
FROM nginx:mainline-alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY docker/frontend/updateConfig.sh /docker-entrypoint.d/updateConfig.sh
RUN chmod +x  /docker-entrypoint.d/updateConfig.sh

# entry
#CMD ["./entryPoint.sh"]
