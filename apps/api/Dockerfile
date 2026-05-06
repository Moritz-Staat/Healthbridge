FROM node:20-alpine
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
