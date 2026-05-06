FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy monorepo structure
COPY package*.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/package*.json ./apps/api/

# Install all workspace dependencies
RUN npm install

# Copy API source
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN cd apps/api && npx prisma generate

EXPOSE 4000
WORKDIR /app/apps/api
CMD ["npx", "tsx", "src/index.ts"]
