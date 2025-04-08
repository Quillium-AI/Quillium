package llmproviders

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

// ChatResponse represents the structured response from the Chat function
type ChatResponse struct {
	Content          string
	RelatedQuestions *chats.RelatedQuestions
}

// StreamResponse represents a chunk of streaming response from the OpenAI API
type StreamResponse struct {
	Content          string                  // Content chunk
	Done             bool                    // Whether this is the final chunk
	RelatedQuestions *chats.RelatedQuestions // Only populated in the final chunk
	Error            error                   // Any error that occurred during streaming
}

// Chat function implements streaming for OpenAI responses
func Chat(model string, api_key string, base_url string, query string, firecrawl_results []string) (ChatResponse, error) {
	log.Printf("Starting OpenAI chat request with model: %s, base_url: %s", model, base_url)
	log.Printf("API key length: %d, first 4 chars: %s", len(api_key), api_key[:4])
	log.Printf("Query length: %d, first 50 chars: %s", len(query), truncateString(query, 50))
	log.Printf("Firecrawl results: %d items", len(firecrawl_results))

	// Initialize the client with API key and base URL
	client := openai.NewClient(
		option.WithAPIKey(api_key),
		option.WithBaseURL(base_url),
	)

	log.Printf("Preparing OpenAI request parameters")

	// Create system message content
	systemMessageContent := `You are Quillium, an advanced AI assistant designed to provide accurate, helpful, and concise responses to user queries. Your primary function is to analyze and synthesize information from multiple sources, including data retrieved from Firecrawl, to deliver precise answers.

				When responding to queries:
				1. Always prioritize accuracy over speculation. If you're uncertain about something, acknowledge the limitations of your knowledge.
				2. When referencing sources, use numerical indices in square brackets like [1], [2], etc. corresponding to the order of sources provided.
				3. When data is provided from Firecrawl, analyze it carefully and extract the most relevant information to address the user's query.
				4. Structure your responses logically with clear sections when appropriate.
				5. Keep your answers concise and focused on the user's question.
				6. Start generating your response immediately and continue in a streaming fashion - don't wait until you have the full answer prepared.
				7. When presenting code or technical information, ensure it is accurate, well-formatted, and includes brief explanations.

				At the end of your response, always include a section with 3-5 related questions that the user might want to ask next. Format this section as follows:

				RELATED_QUESTIONS:
				1. [First related question]
				2. [Second related question]
				3. [Third related question]

				This RELATED_QUESTIONS section is mandatory for every response.`

	// Create user message content with query and Firecrawl results
	userMessageContent := fmt.Sprintf("Here is the Users Query: %s\n\nHere are the Firecrawl results related to the query: %s",
		query, strings.Join(firecrawl_results, "\n"))

	// Create the chat completion request
	req := openai.ChatCompletionNewParams{
		Model: model,
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(systemMessageContent),
			openai.UserMessage(userMessageContent),
		},
	}

	// Make the API call
	log.Printf("Sending request to OpenAI API")
	completion, err := client.Chat.Completions.New(context.Background(), req)
	if err != nil {
		log.Printf("Error calling OpenAI API: %v", err)
		return ChatResponse{}, err
	}

	log.Printf("OpenAI API response received successfully")

	// Get the content from the response
	var rawContent string
	if len(completion.Choices) > 0 {
		rawContent = completion.Choices[0].Message.Content
		log.Printf("Raw content length: %d, first 100 chars: %s", len(rawContent), truncateString(rawContent, 100))
	} else {
		log.Printf("No content received from OpenAI API")
		return ChatResponse{}, fmt.Errorf("no content received from OpenAI API")
	}

	// Extract related questions and clean the content
	cleanedContent, relatedQuestions := ExtractRelatedQuestions(rawContent)

	log.Printf("Cleaned content length: %d, related questions: %v", len(cleanedContent), relatedQuestions != nil)
	return ChatResponse{
		Content:          cleanedContent,
		RelatedQuestions: relatedQuestions,
	}, nil
}

// ChatStream implements streaming for OpenAI responses using the SDK's native streaming support
func ChatStream(model string, api_key string, base_url string, query string, firecrawl_results []string) (chan StreamResponse, error) {
	log.Printf("Starting OpenAI streaming chat request with model: %s", model)

	// Create a response channel
	responseChan := make(chan StreamResponse)

	// Initialize the client with API key and base URL
	client := openai.NewClient(
		option.WithAPIKey(api_key),
		option.WithBaseURL(base_url),
	)

	// Create system message content
	systemMessageContent := `You are Quillium, an advanced AI assistant designed to provide accurate, helpful, and concise responses to user queries. Your primary function is to analyze and synthesize information from multiple sources, including data retrieved from Firecrawl, to deliver precise answers.

			When responding to queries:
			1. Always prioritize accuracy over speculation. If you're uncertain about something, acknowledge the limitations of your knowledge.
			2. When referencing sources, use numerical indices in square brackets like [1], [2], etc. corresponding to the order of sources provided.
			3. When data is provided from Firecrawl, analyze it carefully and extract the most relevant information to address the user's query.
			4. Structure your responses logically with clear sections when appropriate.
			5. Keep your answers concise and focused on the user's question.
			6. Start generating your response immediately and continue in a streaming fashion - don't wait until you have the full answer prepared.
			7. When presenting code or technical information, ensure it is accurate, well-formatted, and includes brief explanations.

			At the end of your response, always include a section with 3-5 related questions that the user might want to ask next. Format this section as follows:

			RELATED_QUESTIONS:
			1. [First related question]
			2. [Second related question]
			3. [Third related question]

			This RELATED_QUESTIONS section is mandatory for every response.`

	// Create user message content with query and Firecrawl results
	userMessageContent := fmt.Sprintf("Here is the Users Query: %s\n\nHere are the Firecrawl results related to the query: %s",
		query, strings.Join(firecrawl_results, "\n"))

	// Create the streaming request
	req := openai.ChatCompletionNewParams{
		Model: model,
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(systemMessageContent),
			openai.UserMessage(userMessageContent),
		},
	}

	// Start a goroutine to handle the streaming
	go func() {
		defer close(responseChan)

		// Create the streaming client
		stream := client.Chat.Completions.NewStreaming(context.Background(), req)

		// Use the accumulator to collect the full response
		acc := openai.ChatCompletionAccumulator{}
		var fullContent strings.Builder

		// Process the stream
		for stream.Next() {
			chunk := stream.Current()
			acc.AddChunk(chunk)

			// Extract the content from the chunk
			var chunkContent string
			if len(chunk.Choices) > 0 {
				// The Delta.Content is a string, not a pointer in this version
				chunkContent = chunk.Choices[0].Delta.Content
				fullContent.WriteString(chunkContent)
			}

			// Send the chunk to the response channel
			responseChan <- StreamResponse{
				Content: chunkContent,
				Done:    false,
			}
		}

		// Check for errors
		if stream.Err() != nil {
			log.Printf("Error in OpenAI streaming: %v", stream.Err())
			responseChan <- StreamResponse{
				Error: stream.Err(),
				Done:  true,
			}
			return
		}

		// Extract related questions from the full content
		_, relatedQuestions := ExtractRelatedQuestions(fullContent.String())

		// Send the final response with related questions
		responseChan <- StreamResponse{
			Content:          "",
			Done:             true,
			RelatedQuestions: relatedQuestions,
		}
	}()

	return responseChan, nil
}

// Helper function to truncate strings for logging
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
