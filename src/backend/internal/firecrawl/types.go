package firecrawl

// SearchParams represents the parameters for a search request
type SearchParams struct {
	Query         string        `json:"query"`
	Limit         int           `json:"limit"`
	Lang          string        `json:"lang"`
	Country       string        `json:"country"`
	Timeout       int           `json:"timeout,omitempty"`
	ScrapeOptions *ScrapeOptions `json:"scrapeOptions"`
}

// ScrapeOptions represents options for scraping content
type ScrapeOptions struct {
	Formats []string `json:"formats"`
}

// SearchResult represents a single search result
type SearchResult struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	URL         string `json:"url"`
	Markdown    string `json:"markdown"`
}

// SearchResponse represents the response from a search request
type SearchResponse struct {
	Success bool           `json:"success"`
	Data    []SearchResult `json:"data"`
	Warning string         `json:"warning"`
}
