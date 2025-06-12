package security

import (
	"crypto/rand"
	"encoding/base64"
)

// GenerateRandomString creates a cryptographically secure random string
// of the specified length (in bytes, before base64 encoding)
func GenerateRandomString(length int) (string, error) {
	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}

	// Convert to base64 for a URL-safe string
	return base64.URLEncoding.EncodeToString(b), nil
}
