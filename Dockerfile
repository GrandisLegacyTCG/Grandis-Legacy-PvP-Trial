FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY server.js ./server.js
COPY server ./server
COPY public ./public
COPY data ./data

EXPOSE 3000
CMD ["node", "server.js"]
