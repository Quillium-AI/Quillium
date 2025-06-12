package api

import (
	"log"
	"net/http"

	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/api/restapi"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/db"
)

// NewServer creates a new API server
func NewServer(addr string, db *db.DB, jwtSecret []byte) *Server {
	return &Server{
		Addr:      addr,
		HttpMux:   http.NewServeMux(),
		DB:        db,
		JWTSecret: jwtSecret,
	}
}

// Start initializes and starts the server
func (s *Server) Start() error {
	// Initialize REST API
	restapi.Initialize(s.DB, s.JWTSecret)

	// Setup REST API routes
	restapi.SetupRoutes(s.HttpMux)

	log.Printf("Server starting on %s", s.Addr)
	return http.ListenAndServe(s.Addr, s.HttpMux)
}
