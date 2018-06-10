FROM node:10-alpine

WORKDIR /app

RUN npm install nodemon -g

RUN chown -R node:node /app
USER node

ADD . .
RUN yarn install

EXPOSE 8080
CMD [ "yarn", "start" ]
