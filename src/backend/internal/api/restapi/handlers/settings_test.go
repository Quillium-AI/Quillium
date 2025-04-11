package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/handlers"
	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/middleware"
	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
	"github.com/Quillium-AI/Quillium/src/backend/internal/settings"
	"github.com/Quillium-AI/Quillium/src/backend/internal/user"
)

// Setup test database for settings tests
func setupSettingsTestDB(t *testing.T) *db.DB {
	// Use test database URL from environment or default to test database
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/quillium_test"
		os.Setenv("DATABASE_URL", dbURL)
	}

	// Initialize database
	testDB, err := db.Initialize()
	if err != nil {
		t.Fatalf("Failed to initialize test database: %v", err)
	}

	return testDB
}

// Setup test context with user ID and admin status
func setupAdminContextForSettingsTests(userID int, isAdmin bool) context.Context {
	ctx := context.Background()
	ctx = context.WithValue(ctx, middleware.UserIDKey(), userID)
	ctx = context.WithValue(ctx, middleware.IsAdminKey(), isAdmin)
	return ctx
}

// Create a test user for settings tests
func createSettingsTestUserForSettingsTests(t *testing.T, testDB *db.DB, isAdmin bool) int {
	// Create a test user
	testUser := &user.User{
		Email:        "settingstest@example.com",
		PasswordHash: new(string),
		IsAdmin:      isAdmin,
		IsSso:        false,
	}
	*testUser.PasswordHash = "hashedpassword"

	userID, err := testDB.CreateUser(testUser)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	return *userID
}

func TestGetAdminSettings(t *testing.T) {
	// Skip if not in integration test mode
	if os.Getenv("INTEGRATION_TESTS") == "" {
		t.Skip("Skipping integration test. Set INTEGRATION_TESTS=1 to run.")
	}

	// Initialize test database
	testDB := setupSettingsTestDB(t)
	defer testDB.Close()

	// Initialize handlers with test database
	handlers.InitHandlers(testDB)

	// Create admin and non-admin users
	adminUserID := createSettingsTestUserForSettingsTests(t, testDB, true)
	regularUserID := createSettingsTestUserForSettingsTests(t, testDB, false)

	// Test cases
	tests := []struct {
		name       string
		userID     int
		isAdmin    bool
		expectCode int
	}{
		{"Admin user can get settings", adminUserID, true, http.StatusOK},
		{"Non-admin user cannot get settings", regularUserID, false, http.StatusForbidden},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Create request with context
			req := httptest.NewRequest("GET", "/api/admin/settings/get", nil)
			req = req.WithContext(setupAdminContextForSettingsTests(tc.userID, tc.isAdmin))
			rec := httptest.NewRecorder()

			// Call the handler
			handlers.GetAdminSettings(rec, req)

			// Check response code
			if rec.Code != tc.expectCode {
				t.Errorf("Expected status %d, got %d", tc.expectCode, rec.Code)
			}

			// For successful requests, verify response content
			if tc.expectCode == http.StatusOK {
				var response settings.AdminSettings
				err := json.Unmarshal(rec.Body.Bytes(), &response)
				if err != nil {
					t.Fatalf("Failed to parse response: %v", err)
				}

				// Check that we got a non-empty response
				if response.LLMProfileSpeed == "" {
					t.Errorf("Expected non-empty LLMProfileSpeed")
				}
			}
		})
	}
}

func TestUpdateAdminSettings(t *testing.T) {
	// Skip if not in integration test mode
	if os.Getenv("INTEGRATION_TESTS") == "" {
		t.Skip("Skipping integration test. Set INTEGRATION_TESTS=1 to run.")
	}

	// Initialize test database
	testDB := setupSettingsTestDB(t)
	defer testDB.Close()

	// Initialize handlers with test database
	handlers.InitHandlers(testDB)

	// Create admin and non-admin users
	adminUserID := createSettingsTestUserForSettingsTests(t, testDB, true)
	regularUserID := createSettingsTestUserForSettingsTests(t, testDB, false)

	// Test cases
	tests := []struct {
		name       string
		userID     int
		isAdmin    bool
		updates    map[string]interface{}
		expectCode int
	}{
		{
			name:    "Admin can update settings",
			userID:  adminUserID,
			isAdmin: true,
			updates: map[string]interface{}{
				"enable_sign_ups":   false,
				"llm_profile_speed": "gpt-4",
			},
			expectCode: http.StatusOK,
		},
		{
			name:       "Non-admin cannot update settings",
			userID:     regularUserID,
			isAdmin:    false,
			updates:    map[string]interface{}{"enable_sign_ups": false},
			expectCode: http.StatusForbidden,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Create request with context and updates
			body, _ := json.Marshal(tc.updates)
			req := httptest.NewRequest("POST", "/api/admin/settings/update", bytes.NewBuffer(body))
			req = req.WithContext(setupAdminContextForSettingsTests(tc.userID, tc.isAdmin))
			rec := httptest.NewRecorder()

			// Call the handler
			handlers.UpdateAdminSettings(rec, req)

			// Check response code
			if rec.Code != tc.expectCode {
				t.Errorf("Expected status %d, got %d", tc.expectCode, rec.Code)
			}

			// For successful requests, verify settings were updated
			if tc.expectCode == http.StatusOK && tc.isAdmin {
				// Get updated settings
				adminSettings, err := testDB.GetAdminSettings()
				if err != nil {
					t.Fatalf("Failed to get admin settings: %v", err)
				}

				// Check if enable_sign_ups was updated
				if val, ok := tc.updates["enable_sign_ups"]; ok {
					expected := val.(bool)
					if adminSettings.EnableSignUps != expected {
						t.Errorf("Expected EnableSignUps to be %v, got %v",
							expected, adminSettings.EnableSignUps)
					}
				}

				// Check if llm_profile_speed was updated
				if val, ok := tc.updates["llm_profile_speed"]; ok {
					expected := val.(string)
					if adminSettings.LLMProfileSpeed != expected {
						t.Errorf("Expected LLMProfileSpeed to be %s, got %s",
							expected, adminSettings.LLMProfileSpeed)
					}
				}
			}
		})
	}
}

func TestUpdateUserSettings(t *testing.T) {
	// Skip if not in integration test mode
	if os.Getenv("INTEGRATION_TESTS") == "" {
		t.Skip("Skipping integration test. Set INTEGRATION_TESTS=1 to run.")
	}

	// Initialize test database
	testDB := setupSettingsTestDB(t)
	defer testDB.Close()

	// Initialize handlers with test database
	handlers.InitHandlers(testDB)

	// Create a test user
	userID := createSettingsTestUserForSettingsTests(t, testDB, false)

	// Create test data
	userSettings := settings.UserSettings{
		IsDarkMode: true,
	}

	// Create request with user context
	reqBody := handlers.UpdateUserSettingsRequest{Settings: userSettings}
	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/api/user/settings", bytes.NewBuffer(body))
	req = req.WithContext(setupAdminContextForSettingsTests(userID, false)) // Regular user, not admin
	rec := httptest.NewRecorder()

	// Call the handler
	handlers.UpdateUserSettings(rec, req)

	// Check response
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, rec.Code)
	}

	// Verify settings were updated
	updatedSettings, err := testDB.GetUserSettings(userID)
	if err != nil {
		t.Fatalf("Failed to get user settings: %v", err)
	}

	if updatedSettings.IsDarkMode != userSettings.IsDarkMode {
		t.Errorf("Expected IsDarkMode %v, got %v",
			userSettings.IsDarkMode, updatedSettings.IsDarkMode)
	}
}
