FROM node:20
WORKDIR /usr/app

COPY package*.json tsconfig*.json ./
COPY src ./src/
RUN npm ci --ignore-scripts \
&& npm run build

ENV TZ="America/Denver"
EXPOSE 5000

CMD [ "node", "dist/index.js" ]
