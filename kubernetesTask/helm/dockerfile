FROM node:22-alpine AS build-dev
WORKDIR /app
COPY package*.json . 
RUN npm install 
COPY server.js .
# ####
FROM gcr.io/distroless/nodejs22-debian12

ENV DB_HOST=localhost
ENV DB_USER=admin
ENV DB_PASS=admin123
ENV DB_NAME=db
ENV LOKI_HOST=http://localhost:3100

COPY --from=build-dev /app /app

WORKDIR /app
EXPOSE 3000
CMD ["server.js"]