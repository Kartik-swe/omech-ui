# Frontend runtime image - built in GitHub Actions, NOT on the droplet.
# Same base/port/command as the droplet's frontend/Dockerfile, so the
# docker-compose labels (Traefik, port 3000) keep working unchanged.
# The droplet only `docker load`s the finished image; it never runs
# npm install (that froze the 1 CPU / 2 GB droplet on 2026-10-08).
FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY .next ./.next
COPY public ./public

EXPOSE 3000
CMD ["npm", "start"]
