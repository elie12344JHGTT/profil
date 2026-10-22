FROM node:22-bookworm-slim

# Le moteur de migration Prisma et TLS s'appuient sur OpenSSL et les certificats.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Permet à `prisma generate` pendant le build. Compose remplace cette valeur au run.
ENV DATABASE_URL="postgresql://vodcast:vodcast@db:5432/vodcast?schema=public"

# Image de développement : ne pas définir NODE_ENV=production ici,
# sinon npm ci omet nodemon, tsx et TypeScript.
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && npm ci \
    && npx prisma generate

COPY . .

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
