package middleware

import (
	"net/http"
	"strings"
)

// CORSType represents the type of CORS configuration to apply
type CORSType int

const (
	// CORSTypeOpen allows requests from any origin
	CORSTypeOpen CORSType = iota
	// CORSTypeLocal restricts requests to localhost only
	CORSTypeLocal
)

// Allowed origins for local CORS
var allowedLocalOrigins = []string{
	"http://localhost:3000",
	"http://127.0.0.1:3000",
}

// IsOriginAllowed checks if the given origin is allowed for the specified CORS type
func IsOriginAllowed(corsType CORSType, origin string) bool {
	// If no origin is provided, allow the request (for curl, etc.)
	if origin == "" {
		return true
	}

	// Check based on CORS type
	switch corsType {
	case CORSTypeLocal:
		// Check if origin is in the allowed list
		for _, allowedOrigin := range allowedLocalOrigins {
			if origin == allowedOrigin {
				return true
			}
		}
		return false
	case CORSTypeOpen:
		// All origins are allowed
		return true
	default:
		return false
	}
}

// WithCORS adds CORS headers to responses
func WithCORS(next http.HandlerFunc) http.HandlerFunc {
	return WithCORSType(CORSTypeOpen, next)
}

// WithCORSType adds CORS headers to responses with specific CORS configuration
func WithCORSType(corsType CORSType, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Set CORS headers based on type
		switch corsType {
		case CORSTypeLocal:
			// Restrict to localhost only
			if origin == "" {
				// No origin header, use default
				w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			} else {
				// Check if origin is allowed
				allowed := false
				for _, allowedOrigin := range allowedLocalOrigins {
					if strings.EqualFold(origin, allowedOrigin) {
						w.Header().Set("Access-Control-Allow-Origin", origin)
						allowed = true
						break
					}
				}

				// If origin is not allowed, reject the request
				if !allowed {
					w.WriteHeader(http.StatusForbidden)
					return
				}
			}
			// Always set Allow-Credentials for local development
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		case CORSTypeOpen:
			// For open CORS with credentials, we can't use wildcard
			if origin != "" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			} else {
				// Fallback to wildcard for requests without origin (not supporting credentials)
				w.Header().Set("Access-Control-Allow-Origin", "*")
			}
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
