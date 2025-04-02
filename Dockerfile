# Build stage for backend
FROM golang:1.24-alpine AS backend-builder
WORKDIR /app/backend

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy backend files
COPY src/backend/go.mod src/backend/go.sum* ./
RUN go mod download
COPY src/backend/ ./

# Build backend
RUN CGO_ENABLED=1 GOOS=linux go build -o quillium .

# Final stage
FROM node:20-alpine AS final-stage
WORKDIR /app

# Install dependencies
RUN apk add --no-cache ca-certificates libc6-compat

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built backend binary
COPY --from=backend-builder /app/backend/quillium /app/

# Copy pre-built frontend files
RUN mkdir -p /app/frontend
WORKDIR /app/frontend

# Copy frontend files (pre-built locally)
COPY src/frontend/package.json src/frontend/pnpm-lock.yaml ./
COPY src/frontend/public ./public
COPY src/frontend/.next ./.next
COPY src/frontend/next.config.js* ./

# Install production dependencies using pnpm
RUN pnpm install --prod --frozen-lockfile

# Back to app directory
WORKDIR /app

# Create startup script that runs both services
RUN printf '#!/bin/sh\ncd /app/frontend && pnpm start & cd /app && ./quillium' > /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports
EXPOSE 8080 3000

# Run the application
CMD ["/app/start.sh"]