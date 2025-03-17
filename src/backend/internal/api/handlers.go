package api

import (
	"encoding/json"
	"net/http"
)

// Response represents a standard API response
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// QueryRequest represents a query from the user
type QueryRequest struct {
	Query string `json:"query"`
}

// QueryResponse represents the AI's response to a query
type QueryResponse struct {
	Answer   string   `json:"answer"`
	Sources  []string `json:"sources,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// HandleQuery processes a user query and returns an AI response
func HandleQuery(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req QueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// TODO: Process the query with the AI service
	// This is a placeholder response
	response := Response{
		Success: true,
		Data: QueryResponse{
			Answer:  "This is a placeholder response. The AI integration will be implemented soon.",
			Sources: []string{"placeholder-source"},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// HandleHealth returns the health status of the API
func HandleHealth(w http.ResponseWriter, r *http.Request) {
	response := Response{
		Success: true,
		Message: "API is healthy",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
