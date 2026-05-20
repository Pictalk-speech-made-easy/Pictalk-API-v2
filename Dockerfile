FROM node:18-bullseye AS builder
RUN npm i -g pnpm@10
WORKDIR /app
COPY ./package.json ./
RUN pnpm install --dangerously-allow-all-builds
COPY . .
RUN pnpm run build

FROM node:18-bullseye
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start:prod"]

