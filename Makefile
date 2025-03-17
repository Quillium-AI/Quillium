.PHONY: build run dev clean docker-build docker-run

# Build both backend and frontend
build: build-backend build-frontend

# Build backend
build-backend:
	cd src/backend && go build -o ../../bin/quillium .

# Build frontend
build-frontend:
	cd src/frontend && npm install && npm run build

# Run the application
run: build
	./bin/quillium

# Run in development mode
dev:
	@echo "Starting backend..."
	cd src/backend && go run main.go &
	@echo "Starting frontend..."
	cd src/frontend && npm run dev

# Clean build artifacts
clean:
	rm -rf bin dist src/frontend/dist

# Build Docker image
docker-build:
	docker build -t quillium .

# Run Docker container
docker-run: docker-build
	docker run -p 8080:8080 -v ./data:/app/data quillium

# Run with Docker Compose
docker-compose-up:
	docker-compose up -d

# Stop Docker Compose
docker-compose-down:
	docker-compose down
