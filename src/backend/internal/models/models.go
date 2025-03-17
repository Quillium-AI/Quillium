package models

import (
	"time"
)

// Query represents a user query and its response
type Query struct {
	ID        int64     `json:"id"`
	Query     string    `json:"query"`
	Answer    string    `json:"answer"`
	Sources   []string  `json:"sources,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// Setting represents a configuration setting
type Setting struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// User represents a user of the system
type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// AIProvider represents an AI provider configuration
type AIProvider struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Endpoint    string `json:"endpoint"`
	APIKey      string `json:"api_key,omitempty"`
	Models      string `json:"models,omitempty"`
	Description string `json:"description,omitempty"`
	IsDefault   bool   `json:"is_default"`
}

// SearchResult represents a search result from an external source
type SearchResult struct {
	Title       string `json:"title"`
	URL         string `json:"url"`
	Description string `json:"description,omitempty"`
	Source      string `json:"source"`
}

// ChatMessage represents a message in a chat session
type ChatMessage struct {
	ID        int64     `json:"id"`
	SessionID int64     `json:"session_id"`
	Role      string    `json:"role"` // "user" or "assistant"
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

// ChatSession represents a chat session
type ChatSession struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id,omitempty"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
