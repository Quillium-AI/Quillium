package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/Quillium-AI/Quillium/internal/api"
	"github.com/Quillium-AI/Quillium/internal/config"
	"github.com/Quillium-AI/Quillium/internal/db"
	"github.com/Quillium-AI/Quillium/internal/middleware"
	"github.com/Quillium-AI/Quillium/internal/websocket"
)

func main() {
	// Initialize configuration
	cfg := config.Get()

	// Initialize database
	database, err := db.Initialize(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Create a new WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Create router
	mux := http.NewServeMux()

	// Apply middleware
	handler := middleware.Chain(
		middleware.Logger,
		middleware.CORS,
		middleware.Recover,
	)(mux)

	// API routes
	mux.HandleFunc("/api/query", api.HandleQuery)
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.ServeWs(hub, w, r)
	})

	// Static file server for frontend
	workDir, _ := os.Getwd()
	frontendDir := filepath.Join(workDir, "../frontend/dist")
	fs := http.FileServer(http.Dir(frontendDir))
	mux.Handle("/", http.StripPrefix("/", fs))

	// Health check endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "OK")
	})

	// Start server
	port := cfg.Port
	log.Printf("Server starting on port %s\n", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Error starting server: %v\n", err)
	}
}
