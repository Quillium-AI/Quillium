package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/middleware"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
	"github.com/Quillium-AI/Quillium/src/backend/internal/settings"
)

func UpdateUserSettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	// Parse request body
	var req UpdateUserSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request: " + err.Error()})
		return
	}

	// Update user settings in database
	err := dbConn.UpdateUserSettings(userID, &req.Settings)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update user settings: " + err.Error()})
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User settings updated successfully"})
}

func GetAdminSettings(w http.ResponseWriter, r *http.Request) {
	// Check if the current user is an admin
	if !middleware.IsAdmin(r.Context()) {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Admin access required"})
		return
	}

	// Get admin settings from database
	adminSettings, err := dbConn.GetAdminSettings()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve admin settings"})
		return
	}

	// Create a response object with API key indicators for frontend display
	response := map[string]interface{}{
		"openai_base_url":        adminSettings.OpenAIBaseURL,
		"llm_profile_speed":      adminSettings.LLMProfileSpeed,
		"llm_profile_balanced":   adminSettings.LLMProfileBalanced,
		"llm_profile_quality":    adminSettings.LLMProfileQuality,
		"enable_sign_ups":        adminSettings.EnableSignUps,
		"webcrawler_url":         adminSettings.WebcrawlerURL,
		"elasticsearch_url":      adminSettings.ElasticsearchURL,
		"elasticsearch_username": adminSettings.ElasticsearchUsername,
		"elasticsearch_password": adminSettings.ElasticsearchPassword,
	}

	// Add indicators for API keys if they exist
	if adminSettings.OpenAIAPIKey_encrypt != "" {
		response["openai_api_key_encrypt"] = "encrypted" // Flag to indicate key exists but is encrypted
	}

	// Return admin settings
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func UpdateAdminSettings(w http.ResponseWriter, r *http.Request) {
	// Check if the current user is an admin
	if !middleware.IsAdmin(r.Context()) {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Admin access required"})
		return
	}

	// Get current admin settings from database
	currentSettings, err := dbConn.GetAdminSettings()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve current admin settings"})
		return
	}

	// Parse request body for partial updates
	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	// Create a new settings object based on the current settings
	// This ensures we don't modify the original object and we preserve all existing values
	newSettings := settings.AdminSettings{
		OpenAIBaseURL:         currentSettings.OpenAIBaseURL,
		OpenAIAPIKey_encrypt:  currentSettings.OpenAIAPIKey_encrypt,
		LLMProfileSpeed:       currentSettings.LLMProfileSpeed,
		LLMProfileBalanced:    currentSettings.LLMProfileBalanced,
		LLMProfileQuality:     currentSettings.LLMProfileQuality,
		EnableSignUps:         currentSettings.EnableSignUps,
		WebcrawlerURL:         currentSettings.WebcrawlerURL,
		ElasticsearchURL:      currentSettings.ElasticsearchURL,
		ElasticsearchUsername: currentSettings.ElasticsearchUsername,
		ElasticsearchPassword: currentSettings.ElasticsearchPassword,
	}

	// Handle API key encryption
	// Check if API keys are provided and encrypt them
	if openaiAPIKey, ok := updates["openai_api_key"].(string); ok && openaiAPIKey != "" {
		// Encrypt the OpenAI API key
		encryptedKey, err := security.EncryptPassword(openaiAPIKey)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encrypt API key"})
			return
		}
		// Set the encrypted key in the new settings object
		newSettings.OpenAIAPIKey_encrypt = *encryptedKey
		// Remove from updates since we've handled it
		delete(updates, "openai_api_key")
	}

	// Apply all other updates to the new settings object
	for key, value := range updates {
		switch key {
		case "openai_base_url":
			if strValue, ok := value.(string); ok {
				newSettings.OpenAIBaseURL = strValue
			}
		case "llm_profile_speed":
			if strValue, ok := value.(string); ok {
				newSettings.LLMProfileSpeed = strValue
			}
		case "llm_profile_balanced":
			if strValue, ok := value.(string); ok {
				newSettings.LLMProfileBalanced = strValue
			}
		case "llm_profile_quality":
			if strValue, ok := value.(string); ok {
				newSettings.LLMProfileQuality = strValue
			}
		case "enable_sign_ups":
			if boolValue, ok := value.(bool); ok {
				newSettings.EnableSignUps = boolValue
			}
		case "webcrawler_url":
			if strValue, ok := value.(string); ok {
				newSettings.WebcrawlerURL = strValue
			}
		case "elasticsearch_url":
			if strValue, ok := value.(string); ok {
				newSettings.ElasticsearchURL = strValue
			}
		case "elasticsearch_username":
			if strValue, ok := value.(string); ok {
				newSettings.ElasticsearchUsername = strValue
			}
		case "elasticsearch_password":
			if strValue, ok := value.(string); ok {
				newSettings.ElasticsearchPassword = strValue
			}
		}
	}

	// Update admin settings in database with the new settings object
	err = dbConn.CreateAdminSettings(&newSettings)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update admin settings"})
		return
	}

	// Return success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Admin settings updated successfully"})
}
