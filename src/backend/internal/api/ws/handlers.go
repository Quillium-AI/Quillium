package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
	"github.com/Quillium-AI/Quillium/src/backend/internal/firecrawl"
	llmproviders "github.com/Quillium-AI/Quillium/src/backend/internal/llm_providers"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
)

// MessageTypes for WebSocket communication
const (
	TypeChatRequest  = "chat_request"
	TypeChatResponse = "chat_response"
	TypeChatStream   = "chat_stream"
	TypeError        = "error"
)

// HandleMessage processes incoming WebSocket messages
func HandleMessage(hub *Hub, client *Client, data []byte) {
	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Printf("Error parsing message: %v", err)
		sendErrorResponse(client, "Invalid message format")
		return
	}

	log.Printf("Received message type: %s", msg.Type)

	switch msg.Type {
	case TypeChatRequest:
		handleChatRequest(client, msg.Content)
	default:
		log.Printf("Unknown message type: %s", msg.Type)
		sendErrorResponse(client, "Unknown message type")
	}
}

// handleChatRequest processes a chat request
func handleChatRequest(client *Client, content interface{}) {
	log.Printf("handleChatRequest: Starting to process chat request")

	// Convert content to JSON and then to ChatRequest
	contentJSON, err := json.Marshal(content)
	if err != nil {
		log.Printf("Error marshaling content: %v", err)
		sendErrorResponse(client, "Invalid request format")
		return
	}

	log.Printf("handleChatRequest: Content marshaled to JSON, length: %d", len(contentJSON))

	var chatReq ChatRequest
	if err := json.Unmarshal(contentJSON, &chatReq); err != nil {
		log.Printf("Error parsing chat request: %v", err)
		sendErrorResponse(client, "Invalid chat request format")
		return
	}

	// Store the active chat ID for this client
	client.activeChatID = chatReq.ChatID

	// Process the chat request in a goroutine
	go processChatRequest(client, chatReq)
}

// generateChatTitle creates a title for a new chat based on the first user message
func generateChatTitle(firstMessage string) string {
	// Truncate the message if it's too long
	if len(firstMessage) > 50 {
		return firstMessage[:47] + "..."
	}
	return firstMessage
}

// processChatRequest handles the actual processing of the chat request
func processChatRequest(client *Client, req ChatRequest) {
	log.Printf("processChatRequest: Starting to process chat request")

	// Get the database connection
	log.Printf("processChatRequest: Initializing database connection")
	dbConn, err := db.Initialize()
	if err != nil {
		log.Printf("Error initializing database: %v", err)
		sendErrorResponse(client, "Internal server error: database connection failed")
		return
	}
	defer dbConn.Close()
	log.Printf("processChatRequest: Database connection initialized successfully")

	// Get admin settings for API keys
	adminSettings, err := dbConn.GetAdminSettings()
	if err != nil {
		log.Printf("Error getting admin settings: %v", err)
		sendErrorResponse(client, "Internal server error: could not get admin settings")
		return
	}

	// Get the latest user message
	if len(req.Messages) == 0 {
		// If no messages array is provided, but a message field exists, create a message from it
		if req.Message != "" {
			log.Printf("No messages array provided, but message field exists. Creating message from it.")
			// Create a new message from the message field
			req.Messages = []chats.Message{
				{
					Role:    "user",
					Content: req.Message,
					MsgNum:  1,
				},
			}
		} else {
			log.Printf("Error: No messages provided in request")
			sendErrorResponse(client, "No messages provided")
			return
		}
	}

	// Determine the message number for this conversation
	msgNum := len(req.Messages) / 2 // Each exchange has a user message and an assistant message

	// Get the user's query (the last message in the array)
	userMessage := req.Messages[len(req.Messages)-1]
	if userMessage.Role != "user" {
		sendErrorResponse(client, "Last message must be from user")
		return
	}

	// Update the user message with the message number
	userMessage.MsgNum = msgNum

	// We'll always stream the response now
	// The DisableStreaming option is ignored

	// Prepare chat history for the AI (excluding Firecrawl data)
	var chatHistory []chats.Message
	for i := 0; i < len(req.Messages)-1; i++ {
		chatHistory = append(chatHistory, req.Messages[i])
	}

	// Search Firecrawl for relevant information
	var firecrawlResults []string
	// Initialize sources as an empty array to ensure it's never null
	sources := []chats.Source{}

	// Decrypt API keys if needed
	firecrawlAPIKey, err := security.DecryptPassword(adminSettings.FirecrawlAPIKey_encrypt)
	if err != nil {
		log.Printf("Error decrypting Firecrawl API key: %v", err)
		sendErrorResponse(client, "Internal server error: Firecrawl API key configuration issue")
		return
	}
	if firecrawlAPIKey == nil {
		log.Printf("Error: Decrypted Firecrawl API key is nil")
		sendErrorResponse(client, "Internal server error: Firecrawl API key is nil")
		return
	}

	openAIAPIKey, err := security.DecryptPassword(adminSettings.OpenAIAPIKey_encrypt)
	if err != nil {
		log.Printf("Error decrypting OpenAI API key: %v", err)
		sendErrorResponse(client, "Internal server error: OpenAI API key configuration issue")
		return
	}
	if openAIAPIKey == nil {
		log.Printf("Error: Decrypted OpenAI API key is nil")
		sendErrorResponse(client, "Internal server error: OpenAI API key is nil")
		return
	}

	// Determine search parameters based on quality profile
	qualityProfile := "balanced" // Default to balanced profile
	if req.Options.QualityProfile != "" {
		qualityProfile = req.Options.QualityProfile
	}

	// Set search parameters based on quality profile
	var enableMarkdown bool
	var resultLimit int
	switch qualityProfile {
	case "speed":
		enableMarkdown = false
		resultLimit = 10
	case "quality":
		enableMarkdown = true
		resultLimit = 10
	default: // balanced
		enableMarkdown = true
		resultLimit = 5
	}

	// Search Firecrawl for the current query
	log.Printf("Making Firecrawl request to %s with query: %s", adminSettings.FirecrawlBaseURL, userMessage.Content)

	firecrawlResp, err := firecrawl.SearchFirecrawl(
		*firecrawlAPIKey,
		adminSettings.FirecrawlBaseURL,
		userMessage.Content,
		true, // Exclude Wikipedia
		enableMarkdown,
		resultLimit,
	)

	if err != nil {
		log.Printf("Error searching Firecrawl: %v", err)
		// Continue without Firecrawl results
	} else {
		log.Printf("Firecrawl search successful, results count=%d", len(firecrawlResp.Data))
		// Parse the Firecrawl results
		parsedSources, formattedResults := firecrawl.ParseSearchResults(firecrawlResp, msgNum)
		log.Printf("Parsed %d sources and %d formatted results from Firecrawl", len(parsedSources), len(formattedResults))
		sources = parsedSources
		firecrawlResults = formattedResults
	}

	// Select the appropriate model based on the quality profile
	var model string
	switch qualityProfile {
	case "speed":
		model = adminSettings.LLMProfileSpeed
	case "quality":
		model = adminSettings.LLMProfileQuality
	default: // balanced
		model = adminSettings.LLMProfileBalanced
	}

	// Call the AI service with streaming
	log.Printf("Making OpenAI streaming request to %s with model: %s", adminSettings.OpenAIBaseURL, model)

	// Create a channel to receive the final response
	responseChan := make(chan llmproviders.ChatResponse, 1)
	// Create a channel to signal when streaming is done
	doneChan := make(chan bool, 1)

	// We don't need to store the full content anymore - direct streaming only

	// Define the streaming callback function
	streamCallback := func(streamResp llmproviders.StreamResponse) {
		// Check for errors
		if streamResp.Error != nil {
			log.Printf("Error in stream: %v", streamResp.Error)
			sendErrorResponse(client, fmt.Sprintf("Error in stream: %v", streamResp.Error))
			doneChan <- true
			return
		}

		// If this is the final chunk with related questions
		if streamResp.Done {
			// Minimal logging for final response
			log.Printf("Sending final response with %d sources", len(sources))

			// Send the final chunk with related questions
			sendChatStreamResponse(client, ChatStreamResponse{
				ChatID:           req.ChatID,
				Content:          "",
				Done:             true,
				Sources:          sources,
				RelatedQuestions: streamResp.RelatedQuestions,
			})

			// Signal that streaming is done
			doneChan <- true
			return
		}

		// No need to accumulate content anymore - direct streaming only

		// Send the chunk to the client
		sendChatStreamResponse(client, ChatStreamResponse{
			ChatID:  req.ChatID,
			Content: streamResp.Content,
			Done:    false,
		})
	}

	// Start the streaming request in a goroutine
	go func() {
		aiResponse, err := llmproviders.Chat(
			model,
			*openAIAPIKey,
			adminSettings.OpenAIBaseURL,
			userMessage.Content,
			firecrawlResults,
			sources,
			streamCallback,
		)
		if err != nil {
			log.Printf("Error calling AI service: %v", err)
			sendErrorResponse(client, "Error generating AI response")
			doneChan <- true
			return
		}
		responseChan <- aiResponse
	}()

	// Wait for streaming to complete - this just waits for the doneChan signal
	// which is sent when the final chunk with related questions is processed
	<-doneChan

	// Get the final response - we don't need to wait for this since we've already
	// streamed all the content directly to the frontend
	var aiResponse llmproviders.ChatResponse
	select {
	case aiResponse = <-responseChan:
		log.Printf("OpenAI response successful")
	default:
		// If we don't get a response immediately, use an empty response
		// This should never happen with direct streaming, but we keep it as a fallback
		log.Printf("Using fallback response")
		aiResponse = llmproviders.ChatResponse{
			Content:          "Sorry, I couldn't generate a response at this time.",
			RelatedQuestions: nil,
		}
	}

	// Create the assistant message
	assistantMessage := chats.Message{
		Role:    "assistant",
		Content: aiResponse.Content,
		MsgNum:  msgNum,
	}

	// Prepare the chat content for saving
	allMessages := append(chatHistory, userMessage, assistantMessage)

	// Create or update the chat content
	chatContent := &chats.ChatContent{
		Title:    generateChatTitle(userMessage.Content),
		Messages: allMessages,
		Sources:  sources,
	}

	// Add related questions if available
	if aiResponse.RelatedQuestions != nil {
		aiResponse.RelatedQuestions.MsgNum = msgNum
		chatContent.RelatedQuestions = aiResponse.RelatedQuestions
	}

	// Save the chat content to the database
	if req.ChatID == "" {
		// Create a new chat
		err = dbConn.CreateChat(client.userID, chatContent)
		if err != nil {
			log.Printf("Error creating chat: %v", err)
			sendErrorResponse(client, "Error creating chat")
			return
		}
	} else {
		// Update existing chat
		chatID := 0
		_, err = fmt.Sscanf(req.ChatID, "%d", &chatID)
		if err != nil {
			log.Printf("Error parsing chat ID: %v", err)
			sendErrorResponse(client, "Error parsing chat ID")
			return
		} else {
			err = dbConn.UpdateChatContent(chatID, chatContent)
			if err != nil {
				log.Printf("Error updating chat: %v", err)
				sendErrorResponse(client, "Error updating chat")
				return
			}
		}
	}

	// We've already streamed the response, so we don't need to do anything else here
	// The response has already been sent to the client through the streaming callback
}

// splitIntoChunks splits a string into chunks of approximately the given size
func splitIntoChunks(s string, chunkSize int) []string {
	var chunks []string
	runes := []rune(s)

	for i := 0; i < len(runes); i += chunkSize {
		end := i + chunkSize
		if end > len(runes) {
			end = len(runes)
		}
		chunks = append(chunks, string(runes[i:end]))
	}

	return chunks
}

// sendChatResponse sends a chat response to the client
func sendChatResponse(client *Client, resp ChatResponse) {
	msg := Message{
		Type:    TypeChatResponse,
		Content: resp,
	}

	sendJSONMessage(client, msg)
}

// sendChatStreamResponse sends a streaming chat response to the client
func sendChatStreamResponse(client *Client, resp ChatStreamResponse) {
	msg := Message{
		Type:    TypeChatStream,
		Content: resp,
	}

	// Minimal logging for final message
	if resp.Done && (len(resp.Sources) > 0 || resp.RelatedQuestions != nil) {
		log.Printf("Final message - Sources: %d, RelatedQuestions: %v", len(resp.Sources), resp.RelatedQuestions != nil)
	}

	sendJSONMessage(client, msg)
}

// Helper function to log JSON objects
func logJSON(label string, obj interface{}) {
	data, err := json.Marshal(obj)
	if err != nil {
		log.Printf("Error marshaling %s: %v", label, err)
		return
	}
	log.Printf("%s: %s", label, string(data))
}

// sendErrorResponse sends an error response to the client
func sendErrorResponse(client *Client, errorMsg string) {
	msg := Message{
		Type:    TypeError,
		Content: ErrorResponse{Error: errorMsg},
	}

	sendJSONMessage(client, msg)
}

// sendJSONMessage marshals and sends a JSON message to the client
func sendJSONMessage(client *Client, msg interface{}) {
	jsonData, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	// Add a small delay to prevent message batching
	time.Sleep(time.Millisecond * 10)
	client.send <- jsonData
}
