# Quillium

Quillium is an open-source AI engine designed to be a self-hosted alternative to Perplexity. It allows you to deploy your own AI-powered search and chat interface while specifying your preferred AI endpoint.

# Table of Contents

[[_TOC_]]

## Features

- Self-hosted AI-powered search and chat interface
- Customizable AI backend - connect to your preferred AI models and endpoints
- Web browsing and search capabilities
- Document analysis and summarization
- Real-time information retrieval and synthesis
- Clean, intuitive user interface
- JWT-based authentication with refresh token pattern
- PostgreSQL database for persistent storage

## Documentation

Comprehensive documentation is available at [docs.quillium.dev](https://docs.quillium.dev), including:

- [Architecture Overview](https://docs.quillium.dev/backend/architecture/)
- [API Reference](https://docs.quillium.dev/backend/api/)
- [Authentication System](https://docs.quillium.dev/backend/authentication/)
- [Database Schema](https://docs.quillium.dev/backend/database/)
- [Testing Guidelines](https://docs.quillium.dev/backend/testing/)
- [Deployment Guide](https://docs.quillium.dev/backend/deployment/)

## Project Structure

```
src/
├── backend/                # Go backend
│   ├── cmd/                # Application entry points
│   │   ├── server/         # Main server application
│   │   └── migrate/        # Database migration tool
│   ├── internal/           # Internal packages
│   │   ├── api/            # API handlers and routes
│   │   │   ├── restapi/    # REST API implementation
│   │   │   └── wsapi/      # WebSocket API implementation
│   │   ├── auth/           # Authentication logic
│   │   ├── chat/           # Chat functionality
│   │   ├── db/             # Database access and models
│   │   ├── security/       # Security utilities
│   │   ├── settings/       # Settings management
│   │   └── user/           # User management
│   ├── migrations/         # Database migrations
│   └── tests/              # Integration tests
└── frontend/               # React frontend
    ├── public/             # Static assets
    ├── src/                # Source code
    │   ├── components/     # Reusable UI components
    │   ├── contexts/       # React contexts
    │   ├── hooks/          # Custom React hooks
    │   ├── pages/          # Page components
    │   ├── services/       # API service clients
    │   ├── styles/         # Global styles
    │   └── utils/          # Utility functions
    └── tests/              # Frontend tests
```

## Installation

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/Quillium-AI/Quillium.git
cd Quillium

# Edit the docker-compose.yml file to set your API key

# Start the application
docker-compose up -d

# Access the application at http://localhost:8080
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/Quillium-AI/Quillium.git
cd Quillium

# Build and run the backend
cd src/backend
go mod download
go run cmd/server/main.go

# In another terminal, build and run the frontend
cd src/frontend
pnpm install
pnpm run dev
```

## Configuration

Quillium can be configured using environment variables. Copy the `.env.example` file to `.env` and modify the values as needed:

```
# Database configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/quillium

# Authentication
JWT_SECRET=your_secure_jwt_secret
ACCESS_TOKEN_EXPIRY=15 # minutes
REFRESH_TOKEN_EXPIRY=7 # days

# Server configuration
PORT=8080
LOG_LEVEL=info
CORS_ALLOWED_ORIGINS=http://localhost:3000

# AI Provider settings
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
```

For a complete list of configuration options, see the [Deployment Guide](https://docs.quillium.dev/backend/deployment/).

## Development

### Prerequisites

- Go 1.20 or higher
- Node.js 18 or higher
- pnpm
- PostgreSQL 12 or higher

### Running Tests

```bash
# Run backend unit tests
cd src/backend
go test ./...

# Run backend integration tests
cd src/backend
INTEGRATION_TESTS=1 go test ./...

# Run frontend tests
cd src/frontend
pnpm test
```

For more information on testing, see the [Testing Documentation](https://docs.quillium.dev/backend/testing/).

## Usage

Once the application is running, you can access it at http://localhost:8080. Enter your query in the search box and Quillium will use the configured AI endpoint to generate a response.

## Contributing

We welcome contributions to Quillium! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute.

Before contributing, please sign our Contributor License Agreement (CLA) which will be automatically requested when you create your first pull request.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Security

If you discover a security vulnerability, please follow our [security policy](SECURITY.md).

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing to the project.
