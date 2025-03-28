package user

import (
	"testing"

	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
)

func TestUserValidatePassword(t *testing.T) {
	// Initialize encryption for the tests
	testKey := []byte("12345678901234567890123456789012") // 32-byte key
	err := security.InitEncryption(testKey)
	if err != nil {
		t.Fatalf("Failed to initialize encryption: %v", err)
	}

	// Test cases
	testCases := []struct {
		name           string
		password       string
		hashedPassword string
		expectedValid  bool
	}{
		{
			name:          "Valid password",
			password:      "correctpassword",
			expectedValid: true,
		},
		{
			name:          "Invalid password",
			password:      "wrongpassword",
			expectedValid: false,
		},
		{
			name:          "Empty password",
			password:      "",
			expectedValid: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Create a hashed password for testing
			correctHash, err := security.HashPassword("correctpassword")
			if err != nil || correctHash == nil {
				t.Fatalf("Failed to create test hash: %v", err)
			}

			// Create a test user
			testUser := &User{
				Email:        "test@example.com",
				PasswordHash: correctHash,
				IsSso:        false,
				IsAdmin:      false,
			}

			// Validate the password
			isValid := testUser.ValidatePassword(tc.password)

			// Check if the result matches expected
			if isValid != tc.expectedValid {
				t.Errorf("Password validation failed. Expected %v, got %v", 
					tc.expectedValid, isValid)
			}
		})
	}

	// Test with nil password hash
	t.Run("Nil password hash", func(t *testing.T) {
		testUser := &User{
			Email:        "test@example.com",
			PasswordHash: nil,
			IsSso:        false,
			IsAdmin:      false,
		}

		isValid := testUser.ValidatePassword("anypassword")
		if isValid {
			t.Error("Password validation should fail with nil hash but didn't")
		}
	})
}
