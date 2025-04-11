package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
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
		log.Printf("Error: No messages provided in request")
		sendErrorResponse(client, "No messages provided")
		return
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

	// Prepare chat history for the AI (excluding Firecrawl data)
	var chatHistory []chats.Message
	for i := 0; i < len(req.Messages)-1; i++ {
		chatHistory = append(chatHistory, req.Messages[i])
	}

	// Search Firecrawl for relevant information
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
	var DisableWikipedia bool
	switch qualityProfile {
	case "speed":
		enableMarkdown = false
		resultLimit = 5
		DisableWikipedia = false
	case "quality":
		enableMarkdown = true
		resultLimit = 10
		DisableWikipedia = true
	default: // balanced
		enableMarkdown = false
		resultLimit = 10
		DisableWikipedia = false
	}

	firecrawlResp, err := firecrawl.SearchFirecrawl(
		*firecrawlAPIKey,
		adminSettings.FirecrawlBaseURL,
		userMessage.Content,
		DisableWikipedia,
		enableMarkdown,
		resultLimit,
	)

	if err != nil {
		log.Printf("Error searching Firecrawl: %v", err)
		// Continue without Firecrawl results
	} else {
		log.Printf("Firecrawl search successful, results count=%d", len(firecrawlResp.Data))
		// Parse the Firecrawl results
		parsedSources, _ := firecrawl.ParseSearchResults(firecrawlResp, msgNum)
		sources = parsedSources
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

	// Accumulator for the full assistant response content
	var fullAssistantContent strings.Builder
	// Create a channel to signal when streaming is done
	doneChan := make(chan bool, 1)

	// Define the streaming callback function
	streamCallback := func(streamResp llmproviders.StreamResponse) {
		// Check for errors
		if streamResp.Error != nil {
			log.Printf("Error in stream: %v", streamResp.Error)
			sendErrorResponse(client, fmt.Sprintf("Error in stream: %v", streamResp.Error))
			// Ensure doneChan is signaled on error
			select {
			case doneChan <- true:
			default:
			}
			return
		}

		if streamResp.Done {
			// Send final stream marker with sources
			sendChatStreamResponse(client, ChatStreamResponse{
				ChatID:  req.ChatID,
				Content: "",
				Done:    true,
				Sources: sources, // Include sources in the final DONE message
			})
			// Signal that streaming is done
			doneChan <- true
			return
		}

		// Append the content chunk to the accumulator
		if streamResp.Content != "" {
			fullAssistantContent.WriteString(streamResp.Content)
		}

		// Send the chunk to the client
		sendChatStreamResponse(client, ChatStreamResponse{
			ChatID:  req.ChatID,
			Content: streamResp.Content,
			Done:    false,
			// Sources are sent only with the final Done message
		})
	}

	// Start the streaming request in a goroutine - ignore the ChatResponse return value
	go func() {
		_, err := llmproviders.Chat( // Ignore the first return value
			model,
			*openAIAPIKey,
			adminSettings.OpenAIBaseURL,
			userMessage.Content,
			nil, // Pass nil instead of formatted firecrawl results
			sources, // Pass sources struct
			streamCallback,
		)
		if err != nil {
			log.Printf("Error calling AI service: %v", err)
			// Ensure doneChan is signaled if Chat fails before streaming starts/finishes
			select {
			case doneChan <- true:
			default:
			}
			sendErrorResponse(client, "Error generating AI response")
			// No return needed here, error is handled via callback/doneChan signal
		}
		// No need to send to responseChan
	}()

	// Wait for streaming to complete
	<-doneChan
	log.Printf("Streaming finished. Final accumulated content length: %d", fullAssistantContent.Len())

	// Create the assistant message using the accumulated content
	assistantMessage := chats.Message{
		Role:    "assistant",
		Content: fullAssistantContent.String(), // Use the accumulated content
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
}

// sendChatStreamResponse sends a streaming chat response to the client
func sendChatStreamResponse(client *Client, resp ChatStreamResponse) {
	msg := Message{
		Type:    TypeChatStream,
		Content: resp,
	}

	sendJSONMessage(client, msg)
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
