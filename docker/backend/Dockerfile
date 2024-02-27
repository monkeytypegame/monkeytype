FROM  node:hydrogen-bookworm 
#as builder
WORKDIR /app

#ENV BACKEND_URL="###MONKEYTYPE_BACKENDURL###"
#ENV RECAPTCHA_SITE_KEY="###RECAPTCHA_SITE_KEY###"

#COPY . .
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY shared-types shared-types
COPY backend backend
RUN ls


RUN npm ci
RUN cd backend && npm ci

EXPOSE 5005

#FROM nginx:latest
#COPY --from=builder /app/frontend/dist /usr/share/nginx/html

#COPY docker/frontend/entryPoint.sh .
#RUN chmod +x ./entryPoint.sh
#CMD ["./entryPoint.sh"]
WORKDIR /app/backend
CMD [ "npm", "run", "dev" ]