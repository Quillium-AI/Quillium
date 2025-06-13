package handlers

import (
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/chats"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/settings"
)

// LoginRequest represents a login request
type LoginRequest struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	RememberMe bool   `json:"remember_me"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	Token        string                `json:"token"`
	RefreshToken string                `json:"refresh_token,omitempty"`
	UserID       int                   `json:"user_id"`
	IsAdmin      bool                  `json:"is_admin"`
	Settings     settings.UserSettings `json:"settings"`
}

// APIKeyResponse represents an API key response
type APIKeyResponse struct {
	APIKey string `json:"api_key"`
}

// SignupRequest represents a signup request
type SignupRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// UserResponse represents a user response with sensitive fields removed
type UserResponse struct {
	ID       int                   `json:"id"`
	Email    string                `json:"email"`
	Username string                `json:"username"`
	IsAdmin  bool                  `json:"is_admin"`
	IsSso    bool                  `json:"is_sso"`
	Settings settings.UserSettings `json:"settings"`
}

// CreateUserRequest represents a request to create a new user
type CreateUserRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
	IsAdmin  bool   `json:"is_admin"`
}

// ChatSummary represents a summary of a chat
type ChatSummary struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
}

// UpdateUserSettingsRequest represents the request body for updating user settings
type UpdateUserSettingsRequest struct {
	Settings settings.UserSettings `json:"settings"`
}

// ChatRequest represents a request to start or continue a chat
// Used by /api/chat/stream (request body, if needed)
type ChatRequest struct {
	ChatID         string          `json:"chatId"`
	QualityProfile string          `json:"qualityprofile"`
	Query          string          `json:"query"`
	Messages       []chats.Message `json:"messages"`
}

// ChatStreamResponse represents a streaming response from the AI
// Used by /api/chat/stream (response)
type ChatStreamResponse struct {
	ChatID  string         `json:"chatId"`
	Content string         `json:"content"`
	Done    bool           `json:"done"`
	Sources []chats.Source `json:"sources,omitempty"`
}
