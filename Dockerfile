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
FROM alpine:latest
WORKDIR /app

# Install dependencies
RUN apk add --no-cache ca-certificates libc6-compat

# Copy built artifacts
COPY --from=backend-builder /app/backend/quillium /app/

# Expose port
EXPOSE 8080

# Run the application
CMD ["/app/quillium"]
