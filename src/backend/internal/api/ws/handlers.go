package ws

import (
	"encoding/json"
	"log"
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

	// Process the chat request (this would normally call an AI service)
	go processChatRequest(client, chatReq)
}

// processChatRequest handles the actual processing of the chat request
// This is a dummy implementation that would normally call an AI service
func processChatRequest(client *Client, req ChatRequest) {
	// Check if this should be a streaming response
	streaming := true

	if streaming {
		// Simulate streaming response
	} else {
		// Simulate non-streaming response
	}
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

	client.send <- jsonData
}
