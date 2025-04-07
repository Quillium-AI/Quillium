package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/middleware"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
	"github.com/Quillium-AI/Quillium/src/backend/internal/user"
)

// GetCurrentUser returns the current authenticated user's information
func GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	// Get user data from database by email
	userObj, err := dbConn.GetUser(nil, &userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve user data: " + err.Error()})
		return
	}

	if userObj == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
		return
	}

	userSettings, err := dbConn.GetUserSettings(*userObj.ID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve user settings: " + err.Error()})
		return
	}

	// Return user data without sensitive fields
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UserResponse{
		ID:       *userObj.ID,
		Email:    userObj.Email,
		IsAdmin:  userObj.IsAdmin,
		IsSso:    userObj.IsSso,
		Settings: *userSettings,
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
		ID:      *newUser.ID,
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
				ID:      *u.ID,
				Email:   u.Email,
				IsAdmin: u.IsAdmin,
				IsSso:   u.IsSso,
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userResponses)
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	// Determine the target user ID to delete
	var targetUserID int

	// Check if request contains a target user ID (for admin deletion)
	targetIDStr := r.URL.Query().Get("id")
	if targetIDStr != "" {
		// Request specifies a target user ID
		var err error
		targetUserID, err = strconv.Atoi(targetIDStr)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID format"})
			return
		}

		// If target ID is different from the current user's ID, check admin privileges
		if targetUserID != userID {
			// Only admins can delete other users
			if !middleware.IsAdmin(r.Context()) {
				w.WriteHeader(http.StatusForbidden)
				json.NewEncoder(w).Encode(map[string]string{"error": "Admin access required to delete other users"})
				return
			}
		}
	} else {
		// No target ID specified, default to deleting the current user
		targetUserID = userID
	}

	// Delete the user
	err := dbConn.DeleteUser(targetUserID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete user"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User deleted successfully"})
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	// Parse request body
	var req struct {
		ID       *int    `json:"id"`
		Email    *string `json:"email"`
		Password *string `json:"password"`
		IsAdmin  *bool   `json:"is_admin"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	// Determine the target user ID to update
	var targetUserID int

	// Check if request contains a target user ID (for admin update)
	if req.ID != nil {
		targetUserID = *req.ID

		// If target ID is different from the current user's ID, check admin privileges
		if targetUserID != userID {
			// Only admins can update other users
			if !middleware.IsAdmin(r.Context()) {
				w.WriteHeader(http.StatusForbidden)
				json.NewEncoder(w).Encode(map[string]string{"error": "Admin access required to update other users"})
				return
			}
		}
	} else {
		// No target ID specified, default to updating the current user
		targetUserID = userID
	}

	// Get the existing user to update
	existingUser, err := dbConn.GetUser(nil, &targetUserID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve user"})
		return
	}

	if existingUser == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
		return
	}

	// Update user fields if provided
	if req.Email != nil {
		// Validate email format
		if !user.IsValidEmail(*req.Email) {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid email format"})
			return
		}

		// Update email
		err = dbConn.UpdateUserEmail(targetUserID, *req.Email)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update email"})
			return
		}
		existingUser.Email = *req.Email
	}

	if req.Password != nil {
		// Validate password strength
		if !user.IsValidPassword(*req.Password) {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Password must be at least 8 characters and contain uppercase, lowercase, and number"})
			return
		}

		// Hash the new password
		passwordHashPtr, err := security.HashPassword(*req.Password)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to hash password"})
			return
		}

		// Update password
		err = dbConn.UpdateUserPassword(targetUserID, *passwordHashPtr)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update password"})
			return
		}
	}

	// Only admins can update admin status
	if req.IsAdmin != nil && middleware.IsAdmin(r.Context()) {
		err = dbConn.UpdateUserIsAdmin(targetUserID, *req.IsAdmin)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update admin status"})
			return
		}
		existingUser.IsAdmin = *req.IsAdmin
	}

	// Return updated user data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UserResponse{
		ID:      *existingUser.ID,
		Email:   existingUser.Email,
		IsAdmin: existingUser.IsAdmin,
		IsSso:   existingUser.IsSso,
	})
}
