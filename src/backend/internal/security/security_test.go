package security

import (
	"testing"
)

func TestHashPassword(t *testing.T) {
	// Test cases
	testCases := []struct {
		name     string
		password string
	}{
		{"Standard password", "password123"},
		{"Empty password", ""},
		{"Special characters", "p@$$w0rd!#%^&*()"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Hash the password
			hashedPassword, err := HashPassword(tc.password)
			if err != nil {
				t.Fatalf("Failed to hash password: %v", err)
			}
			if hashedPassword == nil {
				t.Fatal("Hashed password is nil")
			}
			
			// Verify the hash is not empty
			if *hashedPassword == "" {
				t.Error("Hashed password is empty string")
			}
			
			// Verify the hash is different from the original password
			if *hashedPassword == tc.password {
				t.Error("Hashed password is the same as original password")
			}
		})
	}
}

func TestEncryptDecryptPassword(t *testing.T) {
	// Initialize encryption with a test key
	testKey := []byte("12345678901234567890123456789012") // 32-byte key for AES-256
	err := InitEncryption(testKey)
	if err != nil {
		t.Fatalf("Failed to initialize encryption: %v", err)
	}
	
	// Test cases
	testCases := []struct {
		name     string
		password string
	}{
		{"Standard password", "password123"},
		{"Empty password", ""},
		{"Special characters", "p@$$w0rd!#%^&*()"},
		{"Long password", "this is a very long password that exceeds 32 characters"},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Encrypt
			encrypted, err := EncryptPassword(tc.password)
			if err != nil {
				t.Fatalf("Failed to encrypt password: %v", err)
			}
			if encrypted == nil {
				t.Fatal("Encrypted password is nil")
			}
			
			// Verify encrypted password is different from original
			if *encrypted == tc.password {
				t.Error("Encrypted password is the same as original password")
			}
			
			// Decrypt
			decrypted, err := DecryptPassword(*encrypted)
			if err != nil {
				t.Fatalf("Failed to decrypt password: %v", err)
			}
			if decrypted == nil {
				t.Fatal("Decrypted password is nil")
			}
			
			// Compare
			if *decrypted != tc.password {
				t.Errorf("Decrypted password does not match original. Got %q, want %q", *decrypted, tc.password)
			}
		})
	}
}

func TestInitEncryption(t *testing.T) {
	// Test with valid key length (32 bytes for AES-256)
	validKey := []byte("12345678901234567890123456789012")
	err := InitEncryption(validKey)
	if err != nil {
		t.Errorf("InitEncryption failed with valid key: %v", err)
	}

	// Test with invalid key length
	invalidKey := []byte("tooshort")
	err = InitEncryption(invalidKey)
	if err == nil {
		t.Error("InitEncryption should fail with invalid key length but didn't")
	}
}
