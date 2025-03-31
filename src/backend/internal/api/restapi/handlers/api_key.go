package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/middleware"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
	"github.com/Quillium-AI/Quillium/src/backend/internal/user"
)

// GenerateAPIKey creates a new API key for the authenticated user
func GenerateAPIKey(w http.ResponseWriter, r *http.Request) {
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

	// Generate a new API key
	apiKey, err := security.GenerateRandomString(32)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate API key"})
		return
	}

	// Encrypt the API key before storing it
	encryptedAPIKey, err := security.EncryptPassword(apiKey)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encrypt API key"})
		return
	}

	// Store the encrypted API key in the database
	userObj := &user.User{ID: &userID}
	err = dbConn.CreateUserApikey(userObj, *encryptedAPIKey)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to store API key"})
		return
	}

	// Return the unencrypted API key to the user (they will only see it once)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIKeyResponse{
		APIKey: apiKey,
	})
}

// APIKeyResponse represents the response for API key generation

func DeleteAPIKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	apikey, ok := r.PostForm["apikey"]
	if !ok || len(apikey) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Missing API key"})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	apikeyEncrypt, err := security.EncryptPassword(apikey[0])
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encrypt API key"})
		return
	}

	// Delete the API key from the database
	userObj := &user.User{ID: &userID}
	err = dbConn.DeleteUserApikey(userObj, *apikeyEncrypt)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete API key"})
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "API key deleted successfully"})
}