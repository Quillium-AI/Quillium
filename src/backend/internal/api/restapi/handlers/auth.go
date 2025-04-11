package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"os"

	"strconv"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/middleware"
	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
	"github.com/Quillium-AI/Quillium/src/backend/internal/settings"
	"github.com/Quillium-AI/Quillium/src/backend/internal/user"
)

var dbConn *db.DB
var httpsEnabled, _ = strconv.ParseBool(os.Getenv("HTTPS_SECURE"))

// InitHandlers initializes the handlers with a database connection
func InitHandlers(db *db.DB) {
	dbConn = db
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

	// Debug: Log the remember me value
	log.Printf("Login request received with remember_me: %v", req.RememberMe)

	// Validate credentials
	userData, err := dbConn.GetUser(&req.Email, nil)
	if err != nil || userData == nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	userSettings, err := dbConn.GetUserSettings(*userData.ID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to get user settings"})
		return
	}

	// Verify password using the user's method
	if !userData.ValidatePassword(req.Password) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	// Generate short-lived JWT token (15 minutes)
	token, err := middleware.GenerateJWT(*userData.ID, userData.IsAdmin)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate token"})
		return
	}

	// Set JWT cookie with short expiration for browser clients
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   httpsEnabled,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(15 * time.Minute.Seconds()), // 15 minutes expiration
	})

	// Handle refresh token if remember me is enabled
	var refreshToken string
	if req.RememberMe {
		log.Printf("Generating refresh token for user ID: %d", *userData.ID)
		// Generate refresh token
		refreshToken, err = middleware.GenerateRefreshToken()
		if err != nil {
			log.Printf("Failed to generate refresh token: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate refresh token"})
			return
		}
		log.Printf("Refresh token generated successfully")

		// Store refresh token in database (valid for 180 days)
		refreshExpiration := time.Now().Add(180 * 24 * time.Hour) // 180 days
		log.Printf("Storing refresh token in database with expiration: %v", refreshExpiration)
		err = dbConn.CreateRefreshToken(*userData.ID, refreshToken, refreshExpiration)
		if err != nil {
			log.Printf("Failed to store refresh token in database: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to store refresh token"})
			return
		}
		log.Printf("Refresh token stored successfully in database")

		// Set refresh token cookie for browser clients
		cookie := &http.Cookie{
			Name:     "refresh_token",
			Value:    refreshToken,
			Path:     "/api/auth", // Restrict to auth endpoints only
			HttpOnly: true,
			Secure:   httpsEnabled,
			SameSite: http.SameSiteStrictMode,
			MaxAge:   int(180 * 24 * time.Hour.Seconds()), // 180 days
		}
		http.SetCookie(w, cookie)
		log.Printf("Refresh token cookie set successfully")
	}

	// Return tokens in response body as well (for non-browser clients)
	w.Header().Set("Content-Type", "application/json")
	response := LoginResponse{
		Token:    token,
		UserID:   *userData.ID,
		IsAdmin:  userData.IsAdmin,
		Settings: *userSettings,
	}

	// Add refresh token to response if remember me is enabled
	if req.RememberMe && refreshToken != "" {
		response.RefreshToken = refreshToken
	}

	json.NewEncoder(w).Encode(response)
}

// Logout handles user logout
func Logout(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context if available
	userID, _ := middleware.GetUserID(r.Context())

	// Clear the auth cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   httpsEnabled,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1, // Delete the cookie
	})

	// Clear refresh token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/api/auth",
		HttpOnly: true,
		Secure:   httpsEnabled,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1, // Delete the cookie
	})

	// If we have a user ID, delete all refresh tokens for this user
	if userID > 0 {
		_ = dbConn.DeleteUserRefreshTokens(userID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

// RefreshToken handles token refresh requests
func RefreshToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Get refresh token from request
	var refreshTokenStr string

	// First check if it's in the request body
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}

	err := json.NewDecoder(r.Body).Decode(&req)
	if err == nil && req.RefreshToken != "" {
		refreshTokenStr = req.RefreshToken
	} else {
		// If not in body, check for cookie
		cookie, err := r.Cookie("refresh_token")
		if err != nil || cookie.Value == "" {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "No refresh token provided"})
			return
		}
		refreshTokenStr = cookie.Value
	}

	// Use the refresh token to get a new JWT token
	newToken, userID, isAdmin, err := middleware.RefreshJWT(refreshTokenStr)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid or expired refresh token"})
		return
	}

	// Set the new JWT token as a cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    newToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   httpsEnabled,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(15 * time.Minute.Seconds()), // 15 minutes
	})

	// Get user settings for the response
	userSettings, err := dbConn.GetUserSettings(userID)
	if err != nil {
		userSettings = &settings.UserSettings{} // Use empty settings if error
	}

	// Return the new token in the response body as well
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{
		Token:    newToken,
		UserID:   userID,
		IsAdmin:  isAdmin,
		Settings: *userSettings,
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
	existingUser, err := dbConn.GetUser(&req.Email, nil)
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

	// Generate short-lived JWT token (15 minutes)
	token, err := middleware.GenerateJWT(*userID, false)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate token"})
		return
	}

	// Set JWT cookie with short expiration for browser clients
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   httpsEnabled,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(15 * time.Minute.Seconds()), // 15 minutes expiration
	})

	// Always generate a refresh token for new users (similar to remember me)
	refreshToken, err := middleware.GenerateRefreshToken()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate refresh token"})
		return
	}

	// Store refresh token in database (valid for 180 days)
	refreshExpiration := time.Now().Add(180 * 24 * time.Hour) // 180 days
	err = dbConn.CreateRefreshToken(*userID, refreshToken, refreshExpiration)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to store refresh token"})
		return
	}

	// Set refresh token cookie for browser clients
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/api/auth", // Restrict to auth endpoints only
		HttpOnly: true,
		Secure:   httpsEnabled,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(180 * 24 * time.Hour.Seconds()), // 180 days
	})

	// Get default user settings
	userSettings, err := dbConn.GetUserSettings(*userID)
	if err != nil {
		userSettings = &settings.UserSettings{} // Use empty settings if error
	}

	// Return the token and user info
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		UserID:       *userID,
		IsAdmin:      false,
		Settings:     *userSettings,
	})
}
