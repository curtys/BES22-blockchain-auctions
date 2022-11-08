FROM node:lts-alpine

RUN apk add --update --no-cache g++ make python3

WORKDIR /app

COPY . .
RUN npm install
RUN npm install truffle
RUN npx truffle compile --config truffle-config-docker.js

CMD [ "npm", "start" ]
