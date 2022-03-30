FROM node:14-alpine As development

WORKDIR /usr/src/app

COPY ["package.json", "yarn.lock", "./"]

RUN yarn --frozen-lockfile

COPY . .

RUN yarn build

FROM node:14-alpine As production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY ["package.json", "yarn.lock", "./"]

RUN yarn --frozen-lockfile --production --silent

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["yarn", "start:prod"]
