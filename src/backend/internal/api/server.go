package api

import (
	"log"
	"net/http"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi"
	"github.com/Quillium-AI/Quillium/src/backend/internal/api/ws"
	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
)

// NewServer creates a new API server
func NewServer(addr string, db *db.DB, jwtSecret []byte) *Server {
	return &Server{
		Addr:      addr,
		WSHub:     ws.NewHub(),
		HttpMux:   http.NewServeMux(),
		DB:        db,
		JWTSecret: jwtSecret,
	}
}

// Start initializes and starts the server
func (s *Server) Start() error {
	// Initialize REST API
	restapi.Initialize(s.DB, s.JWTSecret)

	// Start WebSocket hub
	go s.WSHub.Run()

	// Setup REST API routes
	restapi.SetupRoutes(s.HttpMux)

	// Setup WebSocket handler
	s.HttpMux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws.ServeWs(s.WSHub, w, r)
	})

	log.Printf("Server starting on %s", s.Addr)
	return http.ListenAndServe(s.Addr, s.HttpMux)
}
