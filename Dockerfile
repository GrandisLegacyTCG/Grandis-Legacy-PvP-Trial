FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --chown=node:node package.json server.js ./
COPY --chown=node:node server/ ./server/
COPY --chown=node:node client/ ./client/
USER node
EXPOSE 3000
CMD ["node", "server.js"]
