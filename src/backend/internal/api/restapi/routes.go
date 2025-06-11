package restapi

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/handlers"
	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/middleware"
	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
)

// Initialize sets up the REST API with the necessary dependencies
func Initialize(db *db.DB, secret []byte) {
	// Initialize middleware
	middleware.InitAuth(secret, db)

	// Initialize handlers
	handlers.InitHandlers(db)
}

// HealthResponse represents a health check response
type HealthResponse struct {
	Status string `json:"status"`
}

// SetupRoutes configures all REST API routes
func SetupRoutes(mux *http.ServeMux) {
	// No Auth endpoints
	mux.HandleFunc("/api/healthz", withMiddleware(healthCheckHandler, middleware.AuthTypeNone))
	mux.HandleFunc("/api/version", withMiddleware(versionHandler, middleware.AuthTypeNone))
	mux.HandleFunc("/api/auth/login", withMiddleware(handlers.Login, middleware.AuthTypeNone))
	mux.HandleFunc("/api/auth/signup", withMiddleware(handlers.Signup, middleware.AuthTypeNone))
	mux.HandleFunc("/api/auth/refresh", withMiddleware(handlers.RefreshToken, middleware.AuthTypeNone))

	// Frontend-only endpoints (JWT auth required)
	// TODO: Implement SSO endpoints
	mux.HandleFunc("/api/auth/logout", withMiddleware(handlers.Logout, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/auth/api-key/create", withMiddleware(handlers.GenerateAPIKey, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/auth/api-key/delete", withMiddleware(handlers.DeleteAPIKey, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/user/update", withMiddleware(handlers.UpdateUser, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/user/delete", withMiddleware(handlers.DeleteUser, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/user/info", withMiddleware(handlers.GetCurrentUser, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/user/settings", withMiddleware(handlers.UpdateUserSettings, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/user/chats", withMiddleware(handlers.GetChats, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/user/chat/delete", withMiddleware(handlers.DeleteChat, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/user/chat/create", withMiddleware(handlers.CreateChat, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/chat/send", withMiddleware(handlers.SendChatMessage, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/chat/stream", withMiddleware(handlers.StreamChatResponse, middleware.AuthTypeFrontend))

	// Admin endpoints (JWT auth required + admin role)
	mux.HandleFunc("/api/admin/users", withMiddleware(handlers.ListUsers, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/admin/users/create", withMiddleware(handlers.CreateUser, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/admin/users/update", withMiddleware(handlers.UpdateUser, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/admin/users/delete", withMiddleware(handlers.DeleteUser, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/admin/settings/update", withMiddleware(handlers.UpdateAdminSettings, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/admin/settings/get", withMiddleware(handlers.GetAdminSettings, middleware.AuthTypeFrontend))

	// API endpoints (API key auth required)
	mux.HandleFunc("/api/v1/user", withMiddleware(handlers.GetCurrentUser, middleware.AuthTypeAPI))

	// Endpoints accessible via either auth method
	mux.HandleFunc("/api/v1/data", withMiddleware(dataHandler, middleware.AuthTypeAny))
}

// withMiddleware applies common middleware to a handler
func withMiddleware(handler http.HandlerFunc, authType middleware.AuthType) http.HandlerFunc {
	// Apply middleware in reverse order (last applied is executed first)
	h := middleware.WithLogging(handler)
	h = middleware.WithAuth(authType, h)

	// Use different CORS settings based on auth type
	switch authType {
	case middleware.AuthTypeFrontend:
		// For frontend-only endpoints, restrict to localhost
		h = middleware.WithCORSType(middleware.CORSTypeLocal, h)
	default:
		// For other endpoints, use default CORS settings
		h = middleware.WithCORS(h)
	}

	return h
}

// healthCheckHandler responds to health check requests
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := HealthResponse{Status: "ok"}
	json.NewEncoder(w).Encode(response)
	log.Println("Health check request received")
}

// versionHandler returns the API version
func versionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{
		"version": "0.1.0",
	}
	json.NewEncoder(w).Encode(response)
}

// dataHandler is a sample endpoint that returns different data based on auth type
func dataHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Check if this is an API client
	if middleware.IsAPIClient(r.Context()) {
		// API client response
		json.NewEncoder(w).Encode(map[string]string{
			"message": "This is the API response",
			"client":  "api",
		})
	} else {
		// Frontend client response
		json.NewEncoder(w).Encode(map[string]string{
			"message": "This is the frontend response",
			"client":  "frontend",
		})
	}
}
