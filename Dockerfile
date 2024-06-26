FROM node:20
WORKDIR /usr/app

COPY package*.json tsconfig*.json ./
COPY src ./src/
RUN npm ci --ignore-scripts \
&& npm run build \
&& mkdir /usr/app/data \
&& chown node /usr/app/data

ENV TZ="America/Denver"
ENV NODE_ENV='production'
USER node
EXPOSE 5000

CMD [ "node", "--max_old_space_size=8192", "dist/index.js" ]
