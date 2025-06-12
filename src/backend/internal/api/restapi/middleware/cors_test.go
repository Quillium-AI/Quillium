package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/api/restapi/middleware"
)

func TestWithCORS(t *testing.T) {
	// Create a simple test handler
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Test cases
	tests := []struct {
		name           string
		corsType       middleware.CORSType
		origin         string
		expectedOrigin string
		expectedStatus int
	}{
		{
			name:           "Open CORS allows any origin",
			corsType:       middleware.CORSTypeOpen,
			origin:         "https://example.com",
			expectedOrigin: "*",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Local CORS allows localhost origin",
			corsType:       middleware.CORSTypeLocal,
			origin:         "http://localhost:3000",
			expectedOrigin: "http://localhost:3000",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Local CORS rejects other origins",
			corsType:       middleware.CORSTypeLocal,
			origin:         "https://example.com",
			expectedOrigin: "", // No CORS headers for rejected origins
			expectedStatus: http.StatusForbidden,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Create a handler with the CORS middleware
			handler := middleware.WithCORSType(tc.corsType, testHandler)

			// Create a test request and response recorder
			req := httptest.NewRequest("GET", "/test", nil)
			if tc.origin != "" {
				req.Header.Set("Origin", tc.origin)
			}
			rec := httptest.NewRecorder()

			// Call the handler
			handler.ServeHTTP(rec, req)

			// Check status code
			if rec.Code != tc.expectedStatus {
				t.Errorf("Expected status %d, got %d", tc.expectedStatus, rec.Code)
			}

			// Check the CORS headers
			origin := rec.Header().Get("Access-Control-Allow-Origin")
			if origin != tc.expectedOrigin {
				t.Errorf("Expected Access-Control-Allow-Origin: %s, got: %s",
					tc.expectedOrigin, origin)
			}

			// For successful responses, check other CORS headers
			if tc.expectedStatus == http.StatusOK {
				methods := rec.Header().Get("Access-Control-Allow-Methods")
				if methods == "" {
					t.Error("Access-Control-Allow-Methods header not set")
				}

				headers := rec.Header().Get("Access-Control-Allow-Headers")
				if headers == "" {
					t.Error("Access-Control-Allow-Headers header not set")
				}
			}
		})
	}
}

func TestPreflightRequests(t *testing.T) {
	// Create a simple test handler
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// This should not be called for OPTIONS requests
		if r.Method == "OPTIONS" {
			t.Error("Handler was called for OPTIONS request")
		}
		w.WriteHeader(http.StatusOK)
	})

	// Test cases for preflight requests
	tests := []struct {
		name           string
		corsType       middleware.CORSType
		origin         string
		expectedStatus int
	}{
		{
			name:           "Open CORS handles preflight requests",
			corsType:       middleware.CORSTypeOpen,
			origin:         "https://example.com",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Local CORS handles preflight from localhost",
			corsType:       middleware.CORSTypeLocal,
			origin:         "http://localhost:3000",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Local CORS rejects preflight from other origins",
			corsType:       middleware.CORSTypeLocal,
			origin:         "https://example.com",
			expectedStatus: http.StatusForbidden,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Create a handler with the CORS middleware
			handler := middleware.WithCORSType(tc.corsType, testHandler)

			// Create a test OPTIONS request and response recorder
			req := httptest.NewRequest("OPTIONS", "/test", nil)
			req.Header.Set("Origin", tc.origin)
			req.Header.Set("Access-Control-Request-Method", "GET")
			rec := httptest.NewRecorder()

			// Call the handler
			handler.ServeHTTP(rec, req)

			// Check the response code
			if rec.Code != tc.expectedStatus {
				t.Errorf("Expected status %d for OPTIONS request, got %d",
					tc.expectedStatus, rec.Code)
			}

			// For successful responses, check CORS headers
			if tc.expectedStatus == http.StatusOK {
				origin := rec.Header().Get("Access-Control-Allow-Origin")
				if origin == "" {
					t.Error("Access-Control-Allow-Origin header not set for OPTIONS request")
				}

				methods := rec.Header().Get("Access-Control-Allow-Methods")
				if methods == "" {
					t.Error("Access-Control-Allow-Methods header not set for OPTIONS request")
				}
			}
		})
	}
}
