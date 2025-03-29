package restapi

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/handlers"
	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/middleware"
	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
)

var dbConn *db.DB
var jwtSecret []byte

// Initialize sets up the REST API with the necessary dependencies
func Initialize(db *db.DB, secret []byte) {
	dbConn = db
	jwtSecret = secret
	
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
	// Public endpoints (no auth required)
	mux.HandleFunc("/api/healthz", withMiddleware(healthCheckHandler, middleware.AuthTypeNone))
	mux.HandleFunc("/api/version", withMiddleware(versionHandler, middleware.AuthTypeNone))
	mux.HandleFunc("/api/auth/login", withMiddleware(handlers.Login, middleware.AuthTypeNone))
	
	// Frontend-only endpoints (JWT auth required)
	mux.HandleFunc("/api/auth/logout", withMiddleware(handlers.Logout, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/user/me", withMiddleware(handlers.GetCurrentUser, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/auth/api-key", withMiddleware(handlers.GenerateAPIKey, middleware.AuthTypeFrontend))
	
	// Admin endpoints (JWT auth required + admin role)
	mux.HandleFunc("/api/admin/users", withMiddleware(handlers.ListUsers, middleware.AuthTypeFrontend))
	mux.HandleFunc("/api/admin/users/create", withMiddleware(handlers.CreateUser, middleware.AuthTypeFrontend))
	
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
	h = middleware.WithCORS(h)
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
			"client": "api",
		})
	} else {
		// Frontend client response
		json.NewEncoder(w).Encode(map[string]string{
			"message": "This is the frontend response",
			"client": "frontend",
		})
	}
}
