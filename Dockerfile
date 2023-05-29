FROM node:lts

WORKDIR /server

COPY package*.json ./

COPY prisma ./prisma/

COPY src ./src/

COPY .env ./

COPY tsconfig.json ./

COPY . . 

RUN npm install

RUN npx prisma generate

EXPOSE 4000

CMD npm start

