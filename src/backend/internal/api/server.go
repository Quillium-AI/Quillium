package api

import (
	"log"
	"net/http"

	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/api/restapi"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/api/restapi/middleware"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/api/ws"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/db"
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

	// Setup WebSocket handler with proper middleware chain
	s.HttpMux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// Apply Auth middleware first
		middleware.WithAuth(middleware.AuthTypeFrontend, func(w http.ResponseWriter, r *http.Request) {
			// Then apply CORS
			middleware.WithCORSType(middleware.CORSTypeLocal, func(w http.ResponseWriter, r *http.Request) {
				// Finally handle the WebSocket connection
				ws.ServeWs(s.WSHub, w, r)
			})(w, r)
		})(w, r)
	})

	log.Printf("Server starting on %s", s.Addr)
	return http.ListenAndServe(s.Addr, s.HttpMux)
}
