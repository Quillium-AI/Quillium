package firecrawl

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// SearchFirecrawl performs a search using the Firecrawl API
// If excludeWikipedia is true, the search will exclude results from Wikipedia
func SearchFirecrawl(api_key string, base_url string, query string, excludeWikipedia bool, enableMarkdown bool, limit int) (*SearchResponse, error) {
	// Modify query to exclude Wikipedia if requested
	if excludeWikipedia && !strings.Contains(query, "-site:wikipedia.org") {
		query = query + " -site:wikipedia.org"
	}

	// Create search parameters
	params := SearchParams{
		Query:   query,
		Limit:   limit,
		Lang:    "en",
		Country: "us",
		Timeout: 65000, // 65 seconds as per documentation
	}

	if enableMarkdown {
		params.ScrapeOptions = &ScrapeOptions{
			Formats: []string{"markdown"},
		}
	}

	// Convert params to JSON for the request body
	jsonData, err := json.Marshal(params)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal search parameters: %v", err)
	}

	// Use the provided base_url or default to the official API endpoint
	apiEndpoint := base_url
	if apiEndpoint == "" {
		apiEndpoint = "https://api.firecrawl.dev"
	}

	client := &http.Client{
		Timeout: 70 * time.Second, // Client timeout for the HTTP request (slightly longer than the API timeout)
	}

	// Create the request
	reqURL := fmt.Sprintf("%s/search", apiEndpoint)

	// Create a new request
	req, err := http.NewRequest("POST", reqURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers as per documentation
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", api_key))

	// Send the request
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("search request failed: %v", err)
	}

	// Process the response
	defer resp.Body.Close()

	// Read the response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	// Check for non-200 status code
	if resp.StatusCode != 200 {
		var errorResp map[string]interface{}
		if err := json.Unmarshal(respBody, &errorResp); err == nil {
			if errMsg, ok := errorResp["error"].(string); ok {
				return nil, fmt.Errorf("search API error (status %d): %s", resp.StatusCode, errMsg)
			}
		}
		return nil, fmt.Errorf("search API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	// Parse the response
	var response SearchResponse
	if err := json.Unmarshal(respBody, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal search response: %v", err)
	}

	return &response, nil
}
