package api

import (
	"net/http"

	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/db"
)

// Server represents the API server
type Server struct {
	Addr      string
	HttpMux   *http.ServeMux
	DB        *db.DB
	JWTSecret []byte
}
