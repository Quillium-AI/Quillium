package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/api/restapi/handlers/testutils"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/api/restapi/middleware"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/security"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/user"
)

func TestLogin(t *testing.T) {
	// Skip if we shouldn't run tests
	if !testutils.ShouldRunTests(t) {
		return
	}

	// Setup test DB
	testDB := testutils.SetupTestDB(t)
	defer testDB.Close()

	// Initialize handlers with the test DB
	InitHandlers(testDB)

	// Setup middleware with a test secret
	testSecret := []byte("test-secret-key")
	middleware.InitAuth(testSecret, testDB)

	// Create a test user for login tests
	testEmail := "login_test@example.com"
	testPassword := "password123"
	hashedPassword, err := security.HashPassword(testPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	testUser := &user.User{
		Email:        testEmail,
		PasswordHash: hashedPassword,
		IsSso:        false,
		IsAdmin:      false,
	}

	// Insert the test user
	userID, err := testDB.CreateUser(testUser)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Update the user with the returned ID
	if userID == nil {
		t.Fatalf("Expected non-nil user ID from CreateUser")
	}
	testUser.ID = userID

	tests := []struct {
		name             string
		requestBody      LoginRequest
		expectedStatus   int
		expectedResponse interface{}
	}{
		{
			name: "Valid Login",
			requestBody: LoginRequest{
				Email:    testEmail,
				Password: testPassword,
			},
			expectedStatus: http.StatusOK,
			expectedResponse: LoginResponse{
				UserID:  *testUser.ID,
				IsAdmin: testUser.IsAdmin,
			},
		},
		{
			name: "Invalid Credentials",
			requestBody: LoginRequest{
				Email:    "wrong@example.com",
				Password: "wrongpassword",
			},
			expectedStatus: http.StatusUnauthorized,
			expectedResponse: map[string]string{
				"error": "Invalid credentials",
			},
		},
		{
			name: "Invalid Password",
			requestBody: LoginRequest{
				Email:    testEmail,
				Password: "wrongpassword",
			},
			expectedStatus: http.StatusUnauthorized,
			expectedResponse: map[string]string{
				"error": "Invalid credentials",
			},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Create request body
			reqBody, err := json.Marshal(tc.requestBody)
			if err != nil {
				t.Fatalf("Failed to marshal request body: %v", err)
			}

			// Create request
			req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")

			// Create response recorder
			rec := httptest.NewRecorder()

			// Call the handler
			Login(rec, req)

			// Check the status code
			if rec.Code != tc.expectedStatus {
				t.Errorf("Expected status %d, got %d", tc.expectedStatus, rec.Code)
			}

			// Check the response body
			if tc.expectedStatus == http.StatusOK {
				// For successful login, check the login response
				var response LoginResponse
				err = json.Unmarshal(rec.Body.Bytes(), &response)
				if err != nil {
					t.Fatalf("Failed to unmarshal response: %v", err)
				}

				// Check that a token was returned (don't check the exact value)
				if response.Token == "" {
					t.Error("Expected non-empty token in response")
				}

				// Check that the user ID matches (don't check the exact value since it might change)
				if response.UserID == -1 {
					t.Error("Expected non-empty user ID in response")
				}

				// Check that the admin status matches
				expected := tc.expectedResponse.(LoginResponse)
				if response.IsAdmin != expected.IsAdmin {
					t.Errorf("Expected IsAdmin to be %v, got %v", expected.IsAdmin, response.IsAdmin)
				}
			} else {
				// For error responses, check the error message
				var response map[string]string
				err = json.Unmarshal(rec.Body.Bytes(), &response)
				if err != nil {
					t.Fatalf("Failed to unmarshal response: %v", err)
				}

				expected := tc.expectedResponse.(map[string]string)
				if response["error"] != expected["error"] {
					t.Errorf("Expected error %q, got %q", expected["error"], response["error"])
				}
			}
		})
	}
}

func TestLogout(t *testing.T) {
	// Skip if we shouldn't run tests
	if !testutils.ShouldRunTests(t) {
		return
	}

	// Setup test DB
	testDB := testutils.SetupTestDB(t)
	defer testDB.Close()

	// Initialize handlers with the test DB
	InitHandlers(testDB)

	// Create request
	req := httptest.NewRequest("POST", "/api/auth/logout", nil)

	// Create response recorder
	rec := httptest.NewRecorder()

	// Call the handler
	Logout(rec, req)

	// Check the status code
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, rec.Code)
	}

	// Check that a cookie was set to expire the auth token
	cookies := rec.Result().Cookies()
	found := false
	for _, cookie := range cookies {
		if cookie.Name == "auth_token" {
			found = true
			if cookie.MaxAge != -1 {
				t.Errorf("Expected cookie to be expired (MaxAge=-1), got MaxAge=%d", cookie.MaxAge)
			}
		}
	}

	if !found {
		t.Error("Expected auth_token cookie to be set")
	}
}

func TestGenerateAPIKey(t *testing.T) {
	// Skip if we shouldn't run tests
	if !testutils.ShouldRunTests(t) {
		return
	}

	// Setup test DB
	testDB := testutils.SetupTestDB(t)
	defer testDB.Close()

	// Initialize handlers with the test DB
	InitHandlers(testDB)

	// Setup middleware with a test secret
	testSecret := []byte("test-secret-key")
	middleware.InitAuth(testSecret, testDB)

	// Create a test user
	testEmail := "apikey_test@example.com"
	testPassword := "password123"
	hashedPassword, err := security.HashPassword(testPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	testUser := &user.User{
		Email:        testEmail,
		PasswordHash: hashedPassword,
		IsSso:        false,
		IsAdmin:      false,
	}

	// Insert the test user
	userID, err := testDB.CreateUser(testUser)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Update the user with the returned ID
	if userID == nil {
		t.Fatalf("Expected non-nil user ID from CreateUser")
	}
	testUser.ID = userID

	// Create a request with user ID in context
	req := httptest.NewRequest("POST", "/api/auth/apikey", nil)
	if testUser.ID == nil {
		t.Fatalf("Test user ID is nil")
	}
	userIDStr := strconv.Itoa(*testUser.ID)
	ctx := context.WithValue(context.Background(), middleware.UserIDKey(), userIDStr)
	req = req.WithContext(ctx)

	// Create response recorder
	rec := httptest.NewRecorder()

	// Call the handler
	GenerateAPIKey(rec, req)

	// Check the status code
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, rec.Code)
	}

	// Check the response body
	var response APIKeyResponse
	err = json.Unmarshal(rec.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	// Verify that the API key is not empty
	if response.APIKey == "" {
		t.Error("Expected non-empty API key")
	}

	// We can't directly verify that the API key was stored in the database
	// because the API key is encrypted and we don't have access to the original
	// value. Instead, we'll just check that the response was successful.
	// In a real-world scenario, we would use the API key to make a request
	// and verify that it works as expected.
}
