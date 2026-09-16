FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node server/ ./server/
USER node
ENV HOST=0.0.0.0 PORT=7860
EXPOSE 7860
CMD ["node", "server/index.mjs"]
