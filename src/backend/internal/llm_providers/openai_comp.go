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

	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/chats"
)

// Chat function implements streaming for OpenAI responses
// The callback function is called for each chunk of the response
func Chat(model string, api_key string, base_url string, query string, index_results []string, sources []chats.Source, callback func(StreamResponse)) (ChatResponse, error) {
	log.Printf("Preparing OpenAI streaming request parameters")

	// Create system message content
	systemMessageContent := `You are Quillium, an AI assistant. Your purpose is to answer user questions by searching and summarizing relevant information from trusted sources.

							Follow these rules when generating responses:

							1. Be accurate. If you are unsure or information is unavailable, say so clearly.
							2. Keep your answers concise and focused on the user's question.
							3. Reference sources frequently throughout your response using numbered brackets like [1], [2], etc.
							4. Use MULTIPLE sources whenever possible - aim to reference at least 3-5 different sources in your response.
							5. Prioritize information from the provided sources over your own knowledge.
							6. Structure your response clearly using paragraphs, bullet points, or sections when needed.
							7. Do not speculate or generate information that cannot be supported by the sources.

							Always behave like a helpful, knowledgeable, and trustworthy research assistant who thoroughly cites multiple sources.`

	// Create user message content with query and index results
	userMessageContent := fmt.Sprintf("Here is the Users Query: %s\n\nHere are the index results related to the query: %s",
		query, strings.Join(index_results, "\n"))

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

	callback(StreamResponse{
		Content: "",
		Done:    true,
		Sources: sources,
	})

	return ChatResponse{
		Content: "", // No need to return content, it's all been streamed
	}, nil
}
