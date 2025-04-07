package middleware

import (
	"log"
	"net/http"
	"time"
)

// WithLogging adds request logging
func WithLogging(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a custom response writer to capture the status code
		lrw := newLoggingResponseWriter(w)

		// Process the request
		next(lrw, r)

		// Log the request details
		duration := time.Since(start)

		// Check if this is an API client
		apiClient := "no"
		if IsAPIClient(r.Context()) {
			apiClient = "yes"
		}

		log.Printf("%s %s %d %s - API: %s", r.Method, r.URL.Path, lrw.statusCode, duration, apiClient)
	}
}

// loggingResponseWriter is a custom response writer that captures the status code
type loggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

// newLoggingResponseWriter creates a new logging response writer
func newLoggingResponseWriter(w http.ResponseWriter) *loggingResponseWriter {
	return &loggingResponseWriter{w, http.StatusOK}
}

// WriteHeader captures the status code before writing it
func (lrw *loggingResponseWriter) WriteHeader(code int) {
	lrw.statusCode = code
	lrw.ResponseWriter.WriteHeader(code)
}
