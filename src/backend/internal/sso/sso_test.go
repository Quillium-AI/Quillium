package sso

import (
	"encoding/json"
	"testing"
)

func TestSsoProviderToJSON(t *testing.T) {
	// Create a sample SSO provider
	provider := &SsoProvider{
		ClientID:     "client123",
		ClientSecret: "secret456",
		Provider:     "google",
		RedirectURL:  "https://example.com/callback",
		AuthType:     "OAuth2",
	}

	// Convert to JSON
	jsonStr, err := provider.ToJSON()
	if err != nil {
		t.Fatalf("Failed to convert SSO provider to JSON: %v", err)
	}

	// Verify JSON string is not empty
	if jsonStr == "" {
		t.Error("JSON string is empty")
	}

	// Parse the JSON string back to verify contents
	var result map[string]interface{}
	err = json.Unmarshal([]byte(jsonStr), &result)
	if err != nil {
		t.Fatalf("Failed to parse JSON string: %v", err)
	}

	// Verify key fields are present with correct values
	if result["client_id"] != provider.ClientID {
		t.Errorf("Expected client_id to be %s, got %s",
			provider.ClientID, result["client_id"])
	}

	if result["client_secret"] != provider.ClientSecret {
		t.Errorf("Expected client_secret to be %s, got %s",
			provider.ClientSecret, result["client_secret"])
	}

	if result["provider"] != provider.Provider {
		t.Errorf("Expected provider to be %s, got %s",
			provider.Provider, result["provider"])
	}

	if result["auth_type"] != provider.AuthType {
		t.Errorf("Expected auth_type to be %s, got %s",
			provider.AuthType, result["auth_type"])
	}
}

func TestSsoProviderFromJSON(t *testing.T) {
	// Create a JSON string
	jsonStr := `{
		"client_id": "client123",
		"client_secret": "secret456",
		"provider": "google",
		"redirect_url": "https://example.com/callback",
		"auth_type": "OAuth2"
	}`

	// Create an empty SSO provider
	provider := &SsoProvider{}

	// Parse the JSON string
	err := provider.FromJSON(jsonStr)
	if err != nil {
		t.Fatalf("Failed to parse JSON string: %v", err)
	}

	// Verify the parsed values
	if provider.ClientID != "client123" {
		t.Errorf("Expected ClientID to be %s, got %s",
			"client123", provider.ClientID)
	}

	if provider.ClientSecret != "secret456" {
		t.Errorf("Expected ClientSecret to be %s, got %s",
			"secret456", provider.ClientSecret)
	}

	if provider.Provider != "google" {
		t.Errorf("Expected Provider to be %s, got %s",
			"google", provider.Provider)
	}

	if provider.RedirectURL != "https://example.com/callback" {
		t.Errorf("Expected RedirectURL to be %s, got %s",
			"https://example.com/callback", provider.RedirectURL)
	}

	if provider.AuthType != "OAuth2" {
		t.Errorf("Expected AuthType to be %s, got %s",
			"OAuth2", provider.AuthType)
	}
}

// Test with invalid JSON
func TestSsoProviderFromJSONInvalid(t *testing.T) {
	// Create an invalid JSON string
	jsonStr := `{"client_id": "client123", invalid json}`

	// Create an empty SSO provider
	provider := &SsoProvider{}

	// Parse the JSON string
	err := provider.FromJSON(jsonStr)
	if err == nil {
		t.Error("Expected error when parsing invalid JSON, but got nil")
	}
}
