package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"
	"time"

	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/db"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/security"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/user"
	"github.com/golang-jwt/jwt/v5"
)

// shouldRunTests checks if we should run the tests that require a database
func shouldRunTests(t *testing.T) bool {
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

// setupTestDB sets up a test database for the middleware tests
func setupTestDB(t *testing.T) *db.DB {
	// Initialize the test database
	testDB, err := db.Initialize()
	if err != nil {
		t.Fatalf("Failed to initialize test database: %v", err)
	}

	// Initialize the encryption key for security package
	key := []byte("01234567890123456789012345678901") // 32-byte key for AES-256
	err = security.InitEncryption(key)
	if err != nil {
		t.Fatalf("Failed to initialize encryption: %v", err)
	}

	return testDB
}

func TestWithAuth(t *testing.T) {
	// Skip if we shouldn't run tests
	if !shouldRunTests(t) {
		return
	}

	// Setup test DB
	testDB := setupTestDB(t)
	defer testDB.Close()

	// Setup test JWT secret
	testSecret := []byte("test-secret-key")

	// Initialize auth with test secret and DB
	InitAuth(testSecret, testDB)

	// Create a test user
	testEmail := "auth_test@example.com"
	testPassword := "password123"
	hashedPassword, err := security.HashPassword(testPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	testUser := &user.User{
		Email:        testEmail,
		PasswordHash: hashedPassword,
		IsSso:        false,
		IsAdmin:      true, // Make the user an admin for testing
	}

	// Insert the test user
	userID, err := testDB.CreateUser(testUser)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Update the user with the returned ID
	testUser.ID = userID

	// Create a test API key
	testAPIKey := "test-api-key-for-middleware"

	// Encrypt the API key
	encryptedAPIKey, err := security.EncryptPassword(testAPIKey)
	if err != nil {
		t.Fatalf("Failed to encrypt API key: %v", err)
	}

	// Store the API key
	err = testDB.CreateUserApikey(testUser, *encryptedAPIKey)
	if err != nil {
		t.Fatalf("Failed to create API key: %v", err)
	}

	// Create a test handler that will be wrapped by our middleware
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check if user ID was set in context
		userID, ok := GetUserID(r.Context())
		if ok {
			w.Write([]byte(strconv.Itoa(userID)))
		} else {
			w.Write([]byte("no user"))
		}

		// Check if admin status was set in context
		isAdmin := IsAdmin(r.Context())
		if isAdmin {
			w.Write([]byte(" admin"))
		}
	})

	tests := []struct {
		name           string
		authType       AuthType
		setupRequest   func() *http.Request
		expectedStatus int
		expectedBody   string
	}{
		{
			name:     "No Auth Required",
			authType: AuthTypeNone,
			setupRequest: func() *http.Request {
				return httptest.NewRequest("GET", "/test", nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody:   "no user",
		},
		{
			name:     "JWT Auth Success",
			authType: AuthTypeFrontend,
			setupRequest: func() *http.Request {
				// Create a valid JWT token
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
					UserID:  *userID,
					IsAdmin: testUser.IsAdmin,
					RegisteredClaims: jwt.RegisteredClaims{
						ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
					},
				})
				tokenString, _ := token.SignedString(testSecret)

				req := httptest.NewRequest("GET", "/test", nil)
				req.AddCookie(&http.Cookie{
					Name:  "auth_token",
					Value: tokenString,
				})
				return req
			},
			expectedStatus: http.StatusOK,
			expectedBody:   strconv.Itoa(*userID) + " admin",
		},
		{
			name:     "API Key Auth Success",
			authType: AuthTypeAPI,
			setupRequest: func() *http.Request {
				req := httptest.NewRequest("GET", "/test", nil)
				req.Header.Set("X-API-Key", testAPIKey)
				return req
			},
			expectedStatus: http.StatusOK,
			expectedBody:   strconv.Itoa(*userID),
		},
		{
			name:     "Auth Required But Missing",
			authType: AuthTypeFrontend,
			setupRequest: func() *http.Request {
				return httptest.NewRequest("GET", "/test", nil)
			},
			expectedStatus: http.StatusUnauthorized,
			expectedBody:   "",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Create the test request
			req := tc.setupRequest()

			// Create a response recorder
			rec := httptest.NewRecorder()

			// Create the handler with our middleware
			handler := WithAuth(tc.authType, testHandler)

			// Serve the request
			handler.ServeHTTP(rec, req)

			// Check the response
			if rec.Code != tc.expectedStatus {
				t.Errorf("Expected status %d, got %d", tc.expectedStatus, rec.Code)
			}

			if rec.Body.String() != tc.expectedBody {
				t.Errorf("Expected body %q, got %q", tc.expectedBody, rec.Body.String())
			}
		})
	}

	// Clean up - delete the test user's API key
	err = testDB.DeleteUserApikey(testUser, *encryptedAPIKey)
	if err != nil {
		t.Logf("Warning: Failed to delete test API key: %v", err)
	}
}

func TestGenerateJWT(t *testing.T) {
	// Setup test JWT secret
	testSecret := []byte("test-secret-key")
	InitAuth(testSecret, nil)

	tests := []struct {
		name    string
		userID  int
		isAdmin bool
	}{
		{
			name:    "Regular User",
			userID:  123,
			isAdmin: false,
		},
		{
			name:    "Admin User",
			userID:  456,
			isAdmin: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Generate a token
			tokenString, err := GenerateJWT(tc.userID, tc.isAdmin)
			if err != nil {
				t.Fatalf("GenerateJWT returned error: %v", err)
			}

			// Parse the token
			token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
				return testSecret, nil
			})
			if err != nil {
				t.Fatalf("Failed to parse token: %v", err)
			}

			// Check that the token is valid
			if !token.Valid {
				t.Error("Token is not valid")
			}

			// Check the claims
			claims, ok := token.Claims.(*Claims)
			if !ok {
				t.Fatal("Failed to get claims from token")
			}

			if claims.UserID != tc.userID {
				t.Errorf("Expected user ID %d, got %d", tc.userID, claims.UserID)
			}

			if claims.IsAdmin != tc.isAdmin {
				t.Errorf("Expected isAdmin %v, got %v", tc.isAdmin, claims.IsAdmin)
			}
		})
	}
}

func TestContextFunctions(t *testing.T) {
	tests := []struct {
		name     string
		userID   int
		isAdmin  bool
		expected struct {
			userIDExists bool
			userIDValue  int
			isAdmin      bool
		}
	}{
		{
			name:    "Regular User",
			userID:  123,
			isAdmin: false,
			expected: struct {
				userIDExists bool
				userIDValue  int
				isAdmin      bool
			}{
				userIDExists: true,
				userIDValue:  123,
				isAdmin:      false,
			},
		},
		{
			name:    "Admin User",
			userID:  456,
			isAdmin: true,
			expected: struct {
				userIDExists bool
				userIDValue  int
				isAdmin      bool
			}{
				userIDExists: true,
				userIDValue:  456,
				isAdmin:      true,
			},
		},
		{
			name:    "Empty Context",
			userID:  0,
			isAdmin: false,
			expected: struct {
				userIDExists bool
				userIDValue  int
				isAdmin      bool
			}{
				userIDExists: false,
				userIDValue:  0,
				isAdmin:      false,
			},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Create a context
			ctx := context.Background()

			// Add user ID and admin status if needed
			if tc.userID != 0 {
				ctx = context.WithValue(ctx, userIDKey, tc.userID)
			}
			if tc.isAdmin {
				ctx = context.WithValue(ctx, isAdminKey, true)
			}

			// Test GetUserID
			userID, ok := GetUserID(ctx)
			if ok != tc.expected.userIDExists {
				t.Errorf("Expected userIDExists to be %v, got %v", tc.expected.userIDExists, ok)
			}

			if userID != tc.expected.userIDValue {
				t.Errorf("Expected userIDValue to be %d, got %d", tc.expected.userIDValue, userID)
			}

			// Test IsAdmin
			isAdmin := IsAdmin(ctx)
			if isAdmin != tc.expected.isAdmin {
				t.Errorf("Expected isAdmin to be %v, got %v", tc.expected.isAdmin, isAdmin)
			}
		})
	}
}
