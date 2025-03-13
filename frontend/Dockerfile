# Build Stage
FROM node:lts-alpine AS build
WORKDIR /app
COPY --chown=node:node package*.json ./
COPY --chown=node:node . .
RUN npm ci
RUN npm run build
RUN npm prune --omit=dev
 
# Production Stage
FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
USER node
CMD ["nginx", "-g", "daemon off;"]