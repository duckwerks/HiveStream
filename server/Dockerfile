FROM node:20-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server/package.json ./server/package.json
COPY server/server.js ./server/server.js
RUN mkdir -p /app/media
ENV PORT=8787
ENV MEDIA_ROOT=/app/media
EXPOSE 8787
CMD ["node","server/server.js"]
