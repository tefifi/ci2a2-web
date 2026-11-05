# Etapa 1: solo dependencias de producción (para la imagen final)
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Etapa 2: compilar el sitio con el adaptador Node
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Las variables PUBLIC_ se incorporan al compilar (quedan en el código del navegador)
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG PUBLIC_EMAILJS_SERVICE_ID
ARG PUBLIC_EMAILJS_TEMPLATE_ID
ARG PUBLIC_EMAILJS_PUBLIC_KEY
ENV DEPLOY_TARGET=node \
    PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL \
    PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY \
    PUBLIC_EMAILJS_SERVICE_ID=$PUBLIC_EMAILJS_SERVICE_ID \
    PUBLIC_EMAILJS_TEMPLATE_ID=$PUBLIC_EMAILJS_TEMPLATE_ID \
    PUBLIC_EMAILJS_PUBLIC_KEY=$PUBLIC_EMAILJS_PUBLIC_KEY
RUN npm run build

# Etapa 3: imagen final, sin herramientas de desarrollo y sin root
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]