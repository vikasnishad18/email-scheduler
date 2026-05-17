FROM node:20-alpine

WORKDIR /usr/src/app 

COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

