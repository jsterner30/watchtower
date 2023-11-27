FROM node:20
COPY . /app
WORKDIR /app

RUN npm ci --omit=dev

ENV NODE_ENV='production'
USER node
EXPOSE 5000
CMD [ "npm", "start" ]
