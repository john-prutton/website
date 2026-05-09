FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

COPY package*.json ./

RUN pnpm install

COPY . .

RUN pnpm run build

RUN apk add --no-cache brotli && \
    find /app/dist -type f \
      \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.mjs" \
         -o -name "*.json" -o -name "*.svg" -o -name "*.xml" -o -name "*.txt" \) \
      -size +1000c \
      -exec gzip -9 -k {} \; \
      -exec brotli -q 11 -k {} \;

FROM nginx:alpine AS runtime

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
