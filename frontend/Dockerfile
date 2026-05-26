FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY node_modules ./node_modules
COPY public ./public
COPY src ./src
RUN node node_modules/react-scripts/bin/react-scripts.js build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
