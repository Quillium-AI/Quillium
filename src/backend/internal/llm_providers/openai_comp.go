package llmproviders

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
)

// Chat function implements streaming for OpenAI responses
// The callback function is called for each chunk of the response
func Chat(model string, api_key string, base_url string, query string, firecrawl_results []string, sources []chats.Source, callback func(StreamResponse)) (ChatResponse, error) {
	log.Printf("Preparing OpenAI streaming request parameters")

	// Create system message content
	systemMessageContent := `You are Quillium, an advanced AI assistant designed to provide accurate, helpful, and concise responses to user queries.

				Guidelines for your responses:
				- Be accurate and acknowledge limitations when uncertain
				- Reference sources using [1], [2], etc.
				- Keep answers concise and focused on the user's question
				- Present information in a clear, structured way`

	// Create user message content with query and Firecrawl results
	userMessageContent := fmt.Sprintf("Here is the Users Query: %s\n\nHere are the Firecrawl results related to the query: %s",
		query, strings.Join(firecrawl_results, "\n"))

	// Create the request payload
	payload := map[string]interface{}{
		"model": model,
		"messages": []map[string]interface{}{
			{
				"role":    "system",
				"content": systemMessageContent,
			},
			{
				"role":    "user",
				"content": userMessageContent,
			},
		},
		"stream": true,
	}

	// Convert payload to JSON
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling request payload: %v", err)
		return ChatResponse{}, err
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", base_url+"/chat/completions", bytes.NewBuffer(jsonPayload))
	if err != nil {
		log.Printf("Error creating HTTP request: %v", err)
		return ChatResponse{}, err
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+api_key)

	// Make the HTTP request
	log.Printf("Sending streaming request to OpenAI API")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error making HTTP request: %v", err)
		return ChatResponse{}, err
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("OpenAI API error: %s", string(body))
		return ChatResponse{}, fmt.Errorf("OpenAI API error: %s", resp.Status)
	}

	log.Printf("Streaming response started from OpenAI API")

	// Process the streaming response
	scanner := bufio.NewScanner(resp.Body)

	// Increase the scanner buffer size to handle large responses
	buf := make([]byte, 64*1024)   // 64KB buffer
	scanner.Buffer(buf, 1024*1024) // Allow up to 1MB tokens
	// Use a custom split function to handle SSE format properly
	scanner.Split(func(data []byte, atEOF bool) (advance int, token []byte, err error) {
		if atEOF && len(data) == 0 {
			return 0, nil, nil
		}

		// Look for the end of a SSE message (double newline)
		if i := bytes.Index(data, []byte("\n\n")); i >= 0 {
			return i + 2, data[0:i], nil
		}
		// Look for single newline if we can't find double
		if i := bytes.IndexByte(data, '\n'); i >= 0 {
			return i + 1, data[0:i], nil
		}

		// If we're at EOF, return all the data
		if atEOF {
			return len(data), data, nil
		}

		// Request more data
		return 0, nil, nil
	})

	// No need to collect chunks since frontend handles question generation

	// Process each chunk as it comes in
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines
		if line == "" {
			continue
		}

		// Check for end of stream
		if line == "data: [DONE]" {
			log.Printf("Received [DONE] signal from OpenAI API")
			break
		}

		// Parse the JSON data
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			var streamResp map[string]interface{}
			if err := json.Unmarshal([]byte(data), &streamResp); err != nil {
				log.Printf("Error parsing JSON: %v", err)
				continue
			}

			// Extract content from the response
			choices, ok := streamResp["choices"].([]interface{})
			if !ok || len(choices) == 0 {
				continue
			}

			choice, ok := choices[0].(map[string]interface{})
			if !ok {
				continue
			}

			delta, ok := choice["delta"].(map[string]interface{})
			if !ok {
				continue
			}

			content, ok := delta["content"].(string)
			if ok && content != "" {
				// Stream content directly to client
				// Frontend handles related questions extraction
				callback(StreamResponse{
					Content: content,
					Done:    false,
				})
			}
		}
	}

	// Check for scanner errors
	if err := scanner.Err(); err != nil {
		log.Printf("Error reading stream: %v", err)
		callback(StreamResponse{Error: err})
		return ChatResponse{}, err
	}

	log.Println("OpenAI stream completed")
	callback(StreamResponse{
		Content: "",
		Done:    true,
	})

	// The stream is now complete, we can send the final message
	// We don't need to collect content again since we've been streaming it
	log.Printf("Stream completed, sending final message with sources and related questions")

	// No need to process content for related questions
	// The frontend now handles all related question generation
	var relatedQuestions *chats.RelatedQuestions = nil

	// We need to handle the related questions differently
	// Instead of trying to replace already streamed content, we'll use the cleaned content for the final message
	// The frontend will handle displaying the related questions separately

	// Send the final message with sources and related questions
	callback(StreamResponse{
		Content:          "",
		Done:             true,
		Sources:          sources,
		RelatedQuestions: relatedQuestions,
	})

	return ChatResponse{
		Content:          "", // No need to return content, it's all been streamed
		RelatedQuestions: nil, // No related questions from backend
	}, nil
}
