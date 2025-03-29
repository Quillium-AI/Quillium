package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/middleware"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
	"github.com/Quillium-AI/Quillium/src/backend/internal/user"
)

// UserResponse represents a user response with sensitive fields removed
type UserResponse struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	IsAdmin bool   `json:"is_admin"`
	IsSso   bool   `json:"is_sso"`
}

// CreateUserRequest represents a request to create a new user
type CreateUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	IsAdmin  bool   `json:"is_admin"`
}

// GetCurrentUser returns the current authenticated user's information
func GetCurrentUser(w http.ResponseWriter, r *http.Request) {
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

	// Get user data from database by email
	// First we need to get all users and find the one with matching ID
	users, err := dbConn.GetUsers()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve user data"})
		return
	}

	// Find the user with matching ID
	var userData *user.User
	for _, u := range users {
		if u.ID != nil && *u.ID == userID {
			userData = u
			break
		}
	}

	if userData == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
		return
	}

	// Return user data without sensitive fields
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UserResponse{
		ID:      strconv.Itoa(*userData.ID),
		Email:   userData.Email,
		IsAdmin: userData.IsAdmin,
		IsSso:   userData.IsSso,
	})
}

// CreateUser creates a new user (admin only)
func CreateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Check if the current user is an admin
	if !middleware.IsAdmin(r.Context()) {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Admin access required"})
		return
	}

	// Parse request body
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	// Hash the password
	passwordHash, err := security.HashPassword(req.Password)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to hash password"})
		return
	}

	// Create the user
	newUser := &user.User{
		Email:        req.Email,
		PasswordHash: passwordHash,
		IsAdmin:      req.IsAdmin,
		IsSso:        false,
	}

	userID, err := dbConn.CreateUser(newUser)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create user"})
		return
	}

	// Set the ID and return the user data
	newUser.ID = userID
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UserResponse{
		ID:      strconv.Itoa(*newUser.ID),
		Email:   newUser.Email,
		IsAdmin: newUser.IsAdmin,
		IsSso:   newUser.IsSso,
	})
}

// ListUsers returns a list of all users (admin only)
func ListUsers(w http.ResponseWriter, r *http.Request) {
	// Check if the current user is an admin
	if !middleware.IsAdmin(r.Context()) {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Admin access required"})
		return
	}

	// Get all users from database
	users, err := dbConn.GetUsers()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve users"})
		return
	}

	// Convert to response format
	userResponses := make([]UserResponse, 0, len(users))
	for _, u := range users {
		if u.ID != nil {
			userResponses = append(userResponses, UserResponse{
				ID:      strconv.Itoa(*u.ID),
				Email:   u.Email,
				IsAdmin: u.IsAdmin,
				IsSso:   u.IsSso,
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userResponses)
}
