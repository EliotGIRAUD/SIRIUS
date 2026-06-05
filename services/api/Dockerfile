FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/api/package.json ./services/api/

RUN npm ci --workspace=@sirius/shared --workspace=@sirius/api || npm install

COPY packages/shared ./packages/shared
COPY services/api ./services/api

RUN npm run build --workspace=@sirius/shared

WORKDIR /app/services/api
EXPOSE 3001
CMD ["npm", "start"]
