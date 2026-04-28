# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM python:3.12-slim
WORKDIR /app

# Install nginx
RUN apt-get update && apt-get install -y --no-install-recommends nginx supervisor && rm -rf /var/lib/apt/lists/*

# Backend setup
COPY server/requirements.txt /app/server/
RUN pip install --no-cache-dir -r /app/server/requirements.txt
COPY server/ /app/server/

# Frontend built assets
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Config files
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/metahuman.conf

EXPOSE 80
CMD ["supervisord", "-n"]
