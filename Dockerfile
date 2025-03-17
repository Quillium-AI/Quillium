# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend files
COPY src/frontend/package*.json ./
RUN npm install
COPY src/frontend/ ./

# Build frontend
RUN npm run build

# Build stage for backend
FROM golang:1.24-alpine AS backend-builder
WORKDIR /app/backend

# Copy backend files
COPY src/backend/go.mod src/backend/go.sum* ./
RUN go mod download
COPY src/backend/ ./

# Build backend
RUN CGO_ENABLED=1 GOOS=linux go build -o quillium .

# Final stage
FROM alpine:latest
WORKDIR /app

# Install dependencies
RUN apk add --no-cache ca-certificates libc6-compat

# Copy built artifacts
COPY --from=backend-builder /app/backend/quillium /app/
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy .env.example to .env if .env doesn't exist
COPY src/backend/.env.example /app/.env.example
RUN if [ ! -f /app/.env ]; then cp /app/.env.example /app/.env; fi

# Expose port
EXPOSE 8080

# Run the application
CMD ["/app/quillium"]
