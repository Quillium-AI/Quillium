# Contributing to Quillium

## IMPORTANT: GitLab is our primary repository

**PLEASE NOTE:** This GitHub repository is a mirror. All contributions should be made through our GitLab repository:
- Repository URL: https://gitlab.cherkaoui.ch/quillium-ai/quillium
- Issue Board: https://gitlab.cherkaoui.ch/quillium-ai/quillium/-/issues

**Any pull requests or issues opened on GitHub will be ignored and closed after a warning.**

Please fork and create merge requests on GitLab instead.

Thank you for your interest in contributing to Quillium! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Commit Message Conventions

We follow standard git commit message conventions as outlined in our [Code of Conduct](CODE_OF_CONDUCT.md#commit-message-conventions). Please ensure your commit messages follow this format.

## Documentation

Comprehensive documentation for the project is available at [docs.quillium.dev](https://docs.quillium.dev). Please refer to the documentation for detailed information about:

- [API Reference](https://docs.quillium.dev/backend/api/)
- [Authentication System](https://docs.quillium.dev/backend/authentication/)
- [Database Schema](https://docs.quillium.dev/backend/database/)
- [Testing Guidelines](https://docs.quillium.dev/backend/testing/)

When contributing new features or making significant changes, please update the relevant documentation as well.

## How to Contribute

### Reporting Bugs

Bugs are tracked as GitLab issues. Search the [issues](https://gitlab.cherkaoui.ch/quillium-ai/quillium/-/issues) to see if your bug has already been reported. If not, create a new issue with a clear description and as much relevant information as possible.

### Suggesting Enhancements

Enhancement suggestions are also tracked as GitLab issues. Please provide clear descriptions of the enhancement and how it would benefit the project.

### Merge Requests

1. Fork the GitLab repository at https://gitlab.cherkaoui.ch/quillium-ai/quillium
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes using the conventional commit format (`git commit -m 'feat(component): add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Merge Request on GitLab

### Development Workflow

1. Set up your development environment
   ```bash
   # Clone the repository
   git clone https://gitlab.cherkaoui.ch/quillium-ai/quillium.git
   cd Quillium
   
   # Install backend dependencies
   cd src/backend
   go mod download
   
   # Install frontend dependencies
   cd ../frontend
   pnpm install
   ```

2. Run the application in development mode
   ```bash
   # Recommended:
   docker compose up --build

   # Terminal 1 - Run the backend
   cd src/backend
   go run main.go
   
   # Terminal 2 - Run the frontend
   cd src/frontend
   pnpm dev
   ```

3. Make your changes and ensure they pass all tests
   ```bash
   # Run backend tests
   cd src/backend
   go test ./...
   
   # Run frontend tests
   cd src/frontend
   pnpm test
   ```

### Docker Development

**Important:** When building the Docker image, you must pre-build the frontend locally first:

```bash
# Navigate to the frontend directory
cd src/frontend

# Install dependencies if not already installed
pnpm install

# Build the frontend
pnpm build

# Then you can build the Docker image from the project root
cd ../../
docker compose up -d --build
```

The Dockerfile is configured to use the pre-built frontend files rather than building them inside the container. This approach resolves dependency issues and significantly improves build times.

## Project Structure

The Quillium project is organized into several key components:

### Backend (Go)
```
src/backend/
├── cmd/                  # Application entry points
├── internal/             # Internal packages
│   ├── api/              # API handlers and routes
│   ├── chats/            # Chat functionality
│   ├── db/               # Database access and models
│   ├── initialization/   # Initialization logic
│   ├── llm_providers/    # Language model providers
│   ├── security/         # Security utilities
│   ├── settings/         # Settings management
│   ├── sso/              # Single sign-on functionality
│   └── user/             # User management
├── migrations/           # Database migrations
└── tests/                # Integration tests
```

### Frontend (React)
```
src/frontend/
├── public/               # Static assets
├── src/
│   ├── components/       # Reusable UI components
│   └── pages/            # Page components
└── tests/                # Frontend tests
```

For more detailed information about the project structure and architecture, please refer to the [documentation](https://docs.quillium.dev).

## Style Guidelines

### Code Style

- **Go**: Follow the [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments) and use `gofmt` to format your code.
- **JavaScript/React**: Follow the ESLint configuration in the project. We use a combination of React best practices and Airbnb style guide.
- **CSS**: Use CSS modules for component styling to avoid global style conflicts.

### Testing Requirements

- **Backend**: All new features should include appropriate unit tests and integration tests. See the [Testing Documentation](https://docs.quillium.dev/backend/testing/) for details.
- **Frontend**: Components should have unit tests using React Testing Library.

### Commit Messages

Follow the commit message format as described in the [Code of Conduct](CODE_OF_CONDUCT.md#commit-message-conventions):

```
<type>(<scope>): <description>
```

For example:
- `feat(auth): add login functionality`
- `fix(api): resolve null pointer in user data fetch`

## License

By contributing to Quillium, you agree that your contributions will be licensed under the project's [GNU General Public License v3.0](LICENSE).
