package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/Quillium-AI/Quillium/src/backend/internal/config"
)

// Service provides methods for interacting with AI providers
type Service struct {
	endpoint string
	apiKey   string
	client   *http.Client
}

// QueryRequest represents a request to the AI provider
type QueryRequest struct {
	Query  string   `json:"query"`
	Stream bool     `json:"stream,omitempty"`
	Params AIParams `json:"params,omitempty"`
}

// AIParams contains parameters for the AI request
type AIParams struct {
	Model       string  `json:"model,omitempty"`
	Temperature float64 `json:"temperature,omitempty"`
	MaxTokens   int     `json:"max_tokens,omitempty"`
}

// QueryResponse represents a response from the AI provider
type QueryResponse struct {
	Answer   string                 `json:"answer"`
	Sources  []string               `json:"sources,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// NewService creates a new AI service instance
func NewService() *Service {
	cfg := config.Get()
	return &Service{
		endpoint: cfg.AIEndpoint,
		apiKey:   cfg.APIKey,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Query sends a query to the AI provider and returns the response
func (s *Service) Query(query string, params AIParams) (*QueryResponse, error) {
	// Prepare the request
	reqBody := QueryRequest{
		Query:  query,
		Stream: false,
		Params: params,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", s.endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.apiKey))

	// Send request
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check for error status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI provider returned error status: %d, body: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var result QueryResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &result, nil
}

// StreamQuery sends a query to the AI provider and streams the response
// This is a placeholder for streaming functionality
func (s *Service) StreamQuery(query string, params AIParams, callback func(response *QueryResponse)) error {
	// This is a simplified implementation that doesn't actually stream
	// In a real implementation, you would use SSE or WebSockets

	response, err := s.Query(query, params)
	if err != nil {
		return err
	}

	// Call the callback with the response
	callback(response)

	return nil
}
