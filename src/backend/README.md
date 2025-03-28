# Quillium Backend

## Testing

### Running Tests

To run all tests:

```bash
go test ./...
```

To run tests with verbose output:

```bash
go test ./... -v
```

### Database Tests

Database tests will automatically run if a test database is available. If no database connection can be established, these tests will be skipped.

#### Setting up a Test Database

The easiest way to set up a test database is to use the provided Docker Compose file:

```bash
# Start the test database
docker-compose -f docker-compose.dev.yml up -d

# Run tests (database tests will now run automatically)
go test ./... -v
```

#### Test Database Configuration

By default, the tests will try to connect to:

```
postgresql://postgres:postgres@localhost:5432/quillium_test
```

You can override this by setting the `TEST_DATABASE_URL` environment variable:

```bash
TEST_DATABASE_URL="postgresql://custom_user:custom_pass@custom_host:5432/custom_db" go test ./... -v
```

#### Skipping Database Tests

To explicitly skip database tests even if a database is available:

```bash
SKIP_DB_TESTS=true go test ./... -v
```

### Code Coverage

To run tests with coverage reporting:

```bash
go test ./... -cover
```

For a detailed HTML coverage report:

```bash
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```
