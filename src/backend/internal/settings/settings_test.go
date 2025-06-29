package settings

import (
	"encoding/json"
	"testing"
)

func TestAdminSettingsToJSON(t *testing.T) {
	// Create a sample admin settings
	adminSettings := &AdminSettings{
		OpenAIBaseURL:           "https://api.openai.com",
		OpenAIAPIKey_encrypt:    "encrypted-openai-key",
		LLMProfileSpeed:         "gpt-3.5-turbo",
		LLMProfileBalanced:      "gpt-4",
		LLMProfileQuality:       "gpt-4-turbo",
		EnableSignUps:           true,
	}

	// Convert to JSON
	jsonStr, err := adminSettings.ToJSON()
	if err != nil {
		t.Fatalf("Failed to convert admin settings to JSON: %v", err)
	}

	// Verify JSON string is not empty
	if jsonStr == "" {
		t.Error("JSON string is empty")
	}

	// Parse the JSON string back to a struct to verify round-trip works
	var parsedSettings AdminSettings
	err = json.Unmarshal([]byte(jsonStr), &parsedSettings)
	if err != nil {
		t.Fatalf("Failed to parse JSON string: %v", err)
	}

	// Verify key fields match original
	if parsedSettings.OpenAIBaseURL != adminSettings.OpenAIBaseURL {
		t.Errorf("Expected OpenAIBaseURL to be %s, got %s", 
			adminSettings.OpenAIBaseURL, parsedSettings.OpenAIBaseURL)
	}

	if parsedSettings.OpenAIAPIKey_encrypt != adminSettings.OpenAIAPIKey_encrypt {
		t.Errorf("Expected OpenAIAPIKey_encrypt to be %s, got %s", 
			adminSettings.OpenAIAPIKey_encrypt, parsedSettings.OpenAIAPIKey_encrypt)
	}

	if parsedSettings.EnableSignUps != adminSettings.EnableSignUps {
		t.Errorf("Expected EnableSignUps to be %v, got %v", 
			adminSettings.EnableSignUps, parsedSettings.EnableSignUps)
	}
}

func TestAdminSettingsFromJSON(t *testing.T) {
	// Create a JSON string
	jsonStr := `{
		"openai_base_url": "https://api.openai.com",
		"openai_api_key_encrypt": "encrypted-openai-key",
		"llm_profile_speed": "gpt-3.5-turbo",
		"llm_profile_balanced": "gpt-4",
		"llm_profile_quality": "gpt-4-turbo",
		"enable_sign_ups": true
	}`

	// Parse the JSON string
	settings, err := (&AdminSettings{}).FromJSON(jsonStr)
	if err != nil {
		t.Fatalf("Failed to parse JSON string: %v", err)
	}

	// Verify the parsed values
	if settings.OpenAIBaseURL != "https://api.openai.com" {
		t.Errorf("Expected OpenAIBaseURL to be %s, got %s", 
			"https://api.openai.com", settings.OpenAIBaseURL)
	}

	if settings.OpenAIAPIKey_encrypt != "encrypted-openai-key" {
		t.Errorf("Expected OpenAIAPIKey_encrypt to be %s, got %s", 
			"encrypted-openai-key", settings.OpenAIAPIKey_encrypt)
	}

	if !settings.EnableSignUps {
		t.Errorf("Expected EnableSignUps to be %v, got %v", 
			true, settings.EnableSignUps)
	}
}

func TestUserSettingsToJSON(t *testing.T) {
	// Create a sample user settings
	userSettings := &UserSettings{
		IsDarkMode: true,
	}

	// Convert to JSON
	jsonStr, err := userSettings.ToJSON()
	if err != nil {
		t.Fatalf("Failed to convert user settings to JSON: %v", err)
	}

	// Verify JSON string is not empty
	if jsonStr == "" {
		t.Error("JSON string is empty")
	}

	// Parse the JSON string back to a map to verify contents
	var result map[string]interface{}
	err = json.Unmarshal([]byte(jsonStr), &result)
	if err != nil {
		t.Fatalf("Failed to parse JSON string: %v", err)
	}

	// Verify key fields are present
	if result["is_dark_mode"] != userSettings.IsDarkMode {
		t.Errorf("Expected is_dark_mode to be %v, got %v", 
			userSettings.IsDarkMode, result["is_dark_mode"])
	}
}

func TestUserSettingsFromJSON(t *testing.T) {
	// Create a JSON string
	jsonStr := `{
		"is_dark_mode": true
	}`

	// Create an empty user settings
	userSettings := &UserSettings{}

	// Parse the JSON string
	result, err := userSettings.FromJSON(jsonStr)
	if err != nil {
		t.Fatalf("Failed to parse JSON string: %v", err)
	}

	// Verify the parsed values
	if result.IsDarkMode != true {
		t.Errorf("Expected IsDarkMode to be %v, got %v", 
			true, result.IsDarkMode)
	}
}
