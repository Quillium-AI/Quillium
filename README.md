# Quillium

Quillium is an open-source AI engine designed to be a self-hosted alternative to Perplexity. It allows you to deploy your own AI-powered search and chat interface while specifying your preferred AI endpoint.

## Features

- Self-hosted AI-powered search and chat interface
- Customizable AI backend - connect to your preferred AI models and endpoints
- Web browsing and search capabilities
- Document analysis and summarization
- Real-time information retrieval and synthesis
- Clean, intuitive user interface

## Project Structure

```
src/
├── backend/           # Go backend
│   ├── internal/      # Internal packages
│   │   ├── ai/        # AI service integration
│   │   ├── api/       # API handlers
│   │   ├── config/    # Configuration management
│   │   ├── db/        # Database operations
│   │   ├── middleware/# HTTP middleware
│   │   ├── models/    # Data models
│   │   ├── services/  # Business logic services
│   │   ├── utils/     # Utility functions
│   │   └── websocket/ # WebSocket handlers
│   └── main.go        # Entry point
└── frontend/          # React frontend
    ├── public/        # Static assets
    └── src/           # Source code
        ├── components/# UI components
        ├── hooks/     # Custom React hooks
        ├── services/  # API client services
        └── utils/     # Utility functions
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
go run main.go

# In another terminal, build and run the frontend
cd src/frontend
npm install
npm run dev
```

## Configuration

Quillium can be configured using environment variables. Copy the `.env.example` file to `.env` and modify the values as needed:

```
# Server configuration
PORT=8080

# AI service configuration
AI_ENDPOINT=https://api.openai.com/v1
API_KEY=your_api_key_here

# Database configuration
DB_PATH=./data.db
```

## Usage

Once the application is running, you can access it at http://localhost:8080. Enter your query in the search box and Quillium will use the configured AI endpoint to generate a response.

## Contributing

We welcome contributions to Quillium! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute.

Before contributing, please sign our Contributor License Agreement (CLA) which will be automatically requested when you create your first pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

If you discover a security vulnerability, please follow our [security policy](SECURITY.md).

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing to the project.