package firecrawl

import (
	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
)

// ParseSearchResults extracts sources from Firecrawl search results
// Returns a list of sources and a list of formatted results for the AI
func ParseSearchResults(results *SearchResponse, msgNum int) ([]chats.Source, []string) {
	if results == nil || len(results.Data) == 0 {
		return []chats.Source{}, []string{}
	}

	var sources []chats.Source
	var formattedResults []string

	for _, result := range results.Data {
		// Create a source from the search result
		source := chats.Source{
			Title:       result.Title,
			URL:         result.URL,
			Description: result.Description,
			MsgNum:      msgNum,
		}
		sources = append(sources, source)

		// Format the result for the AI
		var content string
		if result.Markdown != "" {
			content = result.Markdown
		} else {
			content = result.Description
		}

		// Format the result as a string for the AI
		formattedResult := "Source: " + result.Title + "\n"
		formattedResult += "URL: " + result.URL + "\n"
		formattedResult += "Content:\n" + content + "\n\n"

		formattedResults = append(formattedResults, formattedResult)
	}

	return sources, formattedResults
}
