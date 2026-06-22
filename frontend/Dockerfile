FROM node:20-slim AS build
WORKDIR /app
ARG REACT_APP_API_BASE_URL=http://192.168.180.11:30080/api
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
COPY package.json package-lock.json* ./
COPY node_modules ./node_modules
COPY public ./public
COPY src ./src
RUN node node_modules/react-scripts/bin/react-scripts.js build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
