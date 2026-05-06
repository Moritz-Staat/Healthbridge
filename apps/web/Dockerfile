FROM node:20-alpine
WORKDIR /app

# Copy monorepo structure
COPY package*.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web/package*.json ./apps/web/

# Install all workspace dependencies
RUN npm install

# Copy web source
COPY apps/web/ ./apps/web/

# Build Next.js
WORKDIR /app/apps/web
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
