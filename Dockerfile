FROM node:18.12.1-alpine

RUN apk add --no-cache git

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package*.json ./

COPY . .

RUN pnpm install

EXPOSE 3333

CMD ["pnpm", "start"]
