package testutils

import (
	"context"
	"os"
	"testing"

	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
)

// ShouldRunTests checks if we should run the tests that require a database
func ShouldRunTests(t *testing.T) bool {
	if os.Getenv("SKIP_API_TESTS") != "" {
		t.Skip("Skipping API tests because SKIP_API_TESTS is set")
		return false
	}
	
	// Set TEST_DATABASE_URL for the test DB
	if os.Getenv("TEST_DATABASE_URL") == "" {
		// Try to use a default test database
		os.Setenv("TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/quillium_test")
	}
	
	return true
}

// SetupTestDB sets up a test database for the handler tests
func SetupTestDB(t *testing.T) *db.DB {
	// Use a test database URL from environment variable or default to a test database
	testDBURL := os.Getenv("TEST_DATABASE_URL")
	if testDBURL == "" {
		// Try different host options to handle Docker networking
		hosts := []string{
			"postgresql://postgres:postgres@localhost:5432/quillium_test",
			"postgresql://postgres:postgres@host.docker.internal:5432/quillium_test",
			"postgresql://postgres:postgres@127.0.0.1:5432/quillium_test",
		}

		// Try each host until one works
		for _, host := range hosts {
			t.Logf("Trying to connect to %s", host)
			// Temporarily set the DATABASE_URL to the current host
			originalDBURL := os.Getenv("DATABASE_URL")
			os.Setenv("DATABASE_URL", host)

			// Try to initialize the database
			testDB, err := db.Initialize()
			if err == nil {
				// Successfully connected, set up encryption and return
				key := []byte("01234567890123456789012345678901") // 32-byte key for AES-256
				err = security.InitEncryption(key)
				if err != nil {
					t.Fatalf("Failed to initialize encryption: %v", err)
				}

				// Clean up the database before running tests
				cleanupTestDB(t, testDB)

				// Reset the original DATABASE_URL after test
				t.Cleanup(func() {
					os.Setenv("DATABASE_URL", originalDBURL)
					testDB.Close()
				})

				return testDB
			}

			// Reset the DATABASE_URL if connection failed
			os.Setenv("DATABASE_URL", originalDBURL)
			t.Logf("Failed to connect to %s: %v", host, err)
		}

		// If we get here, none of the hosts worked
		t.Skip("Skipping test as no test database is available")
		return nil
	}

	// If TEST_DATABASE_URL is set, use it
	originalDBURL := os.Getenv("DATABASE_URL")
	os.Setenv("DATABASE_URL", testDBURL)

	// Initialize the test database
	testDB, err := db.Initialize()
	if err != nil {
		// Reset the DATABASE_URL if connection failed
		os.Setenv("DATABASE_URL", originalDBURL)
		t.Skipf("Failed to initialize test database: %v", err)
		return nil
	}
	
	// Initialize the encryption key for security package
	key := []byte("01234567890123456789012345678901") // 32-byte key for AES-256
	err = security.InitEncryption(key)
	if err != nil {
		// Reset the DATABASE_URL if encryption failed
		os.Setenv("DATABASE_URL", originalDBURL)
		testDB.Close()
		t.Fatalf("Failed to initialize encryption: %v", err)
	}

	// Clean up the database before running tests
	cleanupTestDB(t, testDB)

	// Reset the original DATABASE_URL after test
	t.Cleanup(func() {
		os.Setenv("DATABASE_URL", originalDBURL)
		testDB.Close()
	})
	
	return testDB
}

// cleanupTestDB cleans up the test database by truncating all tables
func cleanupTestDB(t *testing.T, db *db.DB) {
	// List of tables to truncate
	tables := []string{"users", "sso_logins", "admin_settings", "user_settings", "chat_contents", "user_apikeys"}

	// Truncate each table
	for _, table := range tables {
		_, err := db.Exec(context.Background(), "TRUNCATE TABLE "+table+" CASCADE")
		if err != nil {
			t.Logf("Warning: Failed to truncate table %s: %v", table, err)
		}
	}
}
