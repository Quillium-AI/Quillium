package utils

import (
	"testing"
)

func TestGenerateID(t *testing.T) {
	id := GenerateID()
	if len(id) == 0 {
		t.Errorf("GenerateID() returned an empty string")
	}

	// Generate another ID and make sure they're different
	id2 := GenerateID()
	if id == id2 {
		t.Errorf("GenerateID() returned the same ID twice: %s", id)
	}
}

func TestIsEmpty(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"empty string", "", true},
		{"whitespace only", "  \t\n", true},
		{"non-empty string", "hello", false},
		{"whitespace with text", "  hello  ", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsEmpty(tt.input)
			if result != tt.expected {
				t.Errorf("IsEmpty(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestFormatString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"empty string", "", ""},
		{"whitespace only", "  \t\n", ""},
		{"normal string", "hello", "hello"},
		{"string with whitespace", "  hello  ", "hello"},
		{"multi-word string", "  hello  world  ", "hello world"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := FormatString(tt.input)
			if result != tt.expected {
				t.Errorf("FormatString(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}
