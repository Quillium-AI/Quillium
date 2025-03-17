package utils

import (
	"crypto/rand"
	"encoding/hex"
	"strings"
	"time"
)

// GenerateID generates a random ID with the given prefix
func GenerateID(prefix string) (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	id := hex.EncodeToString(bytes)
	if prefix != "" {
		return prefix + "_" + id, nil
	}

	return id, nil
}

// FormatTime formats a time.Time to a string in the format "2006-01-02 15:04:05"
func FormatTime(t time.Time) string {
	return t.Format("2006-01-02 15:04:05")
}

// TruncateString truncates a string to the given length and adds "..." if truncated
func TruncateString(s string, length int) string {
	if len(s) <= length {
		return s
	}

	return s[:length] + "..."
}

// SanitizeString removes unwanted characters from a string
func SanitizeString(s string) string {
	// Remove leading/trailing whitespace
	s = strings.TrimSpace(s)

	// Replace multiple spaces with a single space
	s = strings.Join(strings.Fields(s), " ")

	return s
}

// IsEmpty checks if a string is empty or contains only whitespace
func IsEmpty(s string) bool {
	return strings.TrimSpace(s) == ""
}

// Contains checks if a slice contains a string
func Contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}

	return false
}
