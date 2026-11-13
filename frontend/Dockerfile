# Stage 1: build the React app (this also copies Pyodide into the build, so no CDN is used)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: serve it with nginx, and send the API paths to the Python container
FROM nginx:1.27-alpine
ENV API_HOST=api \
    API_PORT=8000 \
    DNS_RESOLVER=127.0.0.11
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY security.conf /etc/nginx/snippets/security.conf
COPY worker-security.conf /etc/nginx/snippets/worker-security.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
