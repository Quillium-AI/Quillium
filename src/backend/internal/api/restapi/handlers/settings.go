package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/middleware"
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

	// Return admin settings
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(adminSettings)
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

	// Convert current settings to a map for easier updating
	currentMap := make(map[string]interface{})
	currentJSON, _ := json.Marshal(currentSettings)
	json.Unmarshal(currentJSON, &currentMap)

	// Apply only the fields that were provided in the request
	for key, value := range updates {
		currentMap[key] = value
	}

	// Convert back to AdminSettings struct
	updatedJSON, _ := json.Marshal(currentMap)
	var updatedSettings settings.AdminSettings
	json.Unmarshal(updatedJSON, &updatedSettings)

	// Update admin settings in database
	err = dbConn.UpdateAdminSettings(&updatedSettings)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update admin settings"})
		return
	}

	// Return success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Admin settings updated successfully"})
}
