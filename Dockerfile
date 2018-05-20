FROM node:9-alpine

WORKDIR /app

RUN npm install nodemon -g

RUN chown -R node:node /app
USER node

ADD . .

EXPOSE 8080
CMD [ "yarn", "start" ]