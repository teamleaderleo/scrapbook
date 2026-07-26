FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-package-lock --ignore-scripts
COPY src ./src
ENV NODE_ENV=production
EXPOSE 8787
CMD ["node", "src/server.mjs"]
