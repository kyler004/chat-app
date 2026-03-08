# Start from the official Node image
FROM node:20-alpine

# alpine = lightweight Linux. ~50MB vs ~900MB for full Ubuntu

# Set working directory inside the container
WORKDIR /app

# Copy package files FIRST (before source code)
# Docker caches each layer — if package.json didn't change,
# it won't re-run npm install on every build. Big time saver.
COPY package*.json ./
RUN npm install

# Copy Prisma schema (needed before generate)
COPY prisma ./prisma/
RUN npx prisma generate

# Now copy the rest of the source code
COPY . .

EXPOSE 4000

CMD ["node", "src/index.js"]