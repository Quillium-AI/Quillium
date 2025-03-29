package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/middleware"
	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
	"github.com/Quillium-AI/Quillium/src/backend/internal/user"
)

var dbConn *db.DB

// InitHandlers initializes the handlers with a database connection
func InitHandlers(db *db.DB) {
	dbConn = db
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	Token   string `json:"token"`
	UserID  string `json:"user_id"`
	IsAdmin bool   `json:"is_admin"`
}

// APIKeyResponse represents an API key response
type APIKeyResponse struct {
	APIKey string `json:"api_key"`
}

// SignupRequest represents a signup request
type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Login handles user login requests
func Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	// Validate credentials
	userData, err := dbConn.GetUser(req.Email)
	if err != nil || userData == nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	// Verify password using the user's method
	if !userData.ValidatePassword(req.Password) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	userIDStr := "0"
	if userData.ID != nil {
		userIDStr = strconv.Itoa(*userData.ID)
	}
	
	token, err := middleware.GenerateJWT(userIDStr, userData.IsAdmin)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate token"})
		return
	}

	// Set cookie for browser clients
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   r.TLS != nil, // Set to true in production with HTTPS
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(24 * time.Hour.Seconds()),
	})

	// Return token in response body as well (for non-browser clients)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{
		Token:   token,
		UserID:  userIDStr,
		IsAdmin: userData.IsAdmin,
	})
}

// Logout handles user logout
func Logout(w http.ResponseWriter, r *http.Request) {
	// Clear the auth cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   r.TLS != nil,
		MaxAge:   -1, // Delete the cookie
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

// GenerateAPIKey creates a new API key for the authenticated user
func GenerateAPIKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context (set by auth middleware)
	userIDStr, ok := middleware.GetUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	// Convert string ID to int
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
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

// Signup handles user registration
func Signup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	// Validate email and password
	if !user.IsValidEmail(req.Email) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid email format"})
		return
	}

	if !user.IsValidPassword(req.Password) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number"})
		return
	}

	// Check if user already exists
	existingUser, err := dbConn.GetUser(req.Email)
	if err == nil && existingUser != nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "User already exists"})
		return
	}

	// Hash the password
	hashedPassword, err := security.HashPassword(req.Password)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to hash password"})
		return
	}

	// Create the user
	newUser := &user.User{
		Email:        req.Email,
		PasswordHash: hashedPassword,
		IsSso:        false,
		IsAdmin:      false,
	}

	userID, err := dbConn.CreateUser(newUser)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create user: " + err.Error()})
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateToken(strconv.Itoa(*userID), false, time.Hour*24)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate token"})
		return
	}

	// Return the token and user info
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{
		Token:   token,
		UserID:  strconv.Itoa(*userID),
		IsAdmin: false,
	})
}
