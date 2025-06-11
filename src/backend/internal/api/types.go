package api

import (
	"net/http"

	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
)

// Server represents the API server
type Server struct {
	Addr      string
	HttpMux   *http.ServeMux
	DB        *db.DB
	JWTSecret []byte
}
