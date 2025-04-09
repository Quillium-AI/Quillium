package ws

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
)

// ChatSession represents an active chat session
type ChatSession struct {
	UserID   string
	Messages []chats.Message
}

// ChatManager manages active chat sessions
type ChatManager struct {
	sessions map[string]*ChatSession
	mutex    sync.RWMutex
}

// NewChatManager creates a new chat manager
func NewChatManager() *ChatManager {
	return &ChatManager{
		sessions: make(map[string]*ChatSession),
	}
}

// GetSession retrieves a chat session by ID
func (cm *ChatManager) GetSession(id string) (*ChatSession, bool) {
	cm.mutex.RLock()
	defer cm.mutex.RUnlock()
	session, exists := cm.sessions[id]
	return session, exists
}

// CreateSession creates a new chat session
func (cm *ChatManager) CreateSession(userID string) *ChatSession {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	session := &ChatSession{
		UserID:   userID,
		Messages: []chats.Message{},
	}

	cm.sessions[userID] = session
	return session
}

// AddMessage adds a message to a chat session
func (cm *ChatManager) AddMessage(chatID string, message chats.Message) bool {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	session, exists := cm.sessions[chatID]
	if !exists {
		return false
	}

	session.Messages = append(session.Messages, message)
	return true
}

// SaveChat saves a chat session to the database
// This is a placeholder function - in a real implementation, you would save to a database
func (cm *ChatManager) SaveChat(chatID string) error {
	// In a real implementation, you would save the chat to a database
	// For now, we'll just log that we're saving the chat
	log.Printf("Saving chat %s to database", chatID)
	return nil
}

// ProcessChatRequest processes a chat request and sends responses to the client
func ProcessChatRequest(client *Client, req ChatRequest) {
	// In a real implementation, this would call the appropriate LLM provider
	// based on the request options

	// For now, we'll just use our dummy implementation
	processChatRequest(client, req)
}

// GetChatHistory retrieves chat history from the database
// This is a placeholder function - in a real implementation, you would fetch from a database
func GetChatHistory(userID string) ([]ChatSession, error) {
	// In a real implementation, you would fetch chat history from a database
	// For now, we'll just return an empty slice
	return []ChatSession{}, nil
}

// DeleteChat deletes a chat session
// This is a placeholder function - in a real implementation, you would delete from a database
func DeleteChat(chatID string) error {
	// In a real implementation, you would delete the chat from a database
	// For now, we'll just log that we're deleting the chat
	log.Printf("Deleting chat %s from database", chatID)
	return nil
}

// StreamResponseToClient streams a response to the client
func StreamResponseToClient(client *Client, chatID string, content string, done bool) {
	// Minimal logging for streaming response
	if done {
		log.Printf("Completed streaming response")
	}
	streamResp := ChatStreamResponse{
		ChatID:  chatID,
		Content: content,
		Done:    done,
	}

	sendChatStreamResponse(client, streamResp)
}

// SendFinalResponse sends sources and related questions after streaming completes
func SendFinalResponse(client *Client, chatID string, sources []chats.Source, relatedQuestions *chats.RelatedQuestions) {
	finalResp := ChatStreamResponse{
		ChatID:           chatID,
		Sources:          sources,
		RelatedQuestions: relatedQuestions,
	}
	sendChatStreamResponse(client, finalResp)
}

// SendResponseToClient sends a complete response to the client
func SendResponseToClient(client *Client, chatID string, message chats.Message) {
	// Send the complete response
	sendChatResponse(client, ChatResponse{
		ChatID:  chatID,
		Message: message,
		Done:    true,
	})
}

// RegisterChatHandlers registers chat-related WebSocket message handlers
func RegisterChatHandlers() {
	// This would be used to register specific message type handlers
	// For now, we're handling everything in the HandleMessage function
}

// WebSocketMessage defines the structure of messages sent over WebSocket
type WebSocketMessage struct {
	Type    string      `json:"type"`
	Content interface{} `json:"content"`
}

// Debug function to log the content of a WebSocketMessage
func logWebSocketMessage(msg WebSocketMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling WebSocketMessage for debug: %v", err)
		return
	}
	log.Printf("WebSocketMessage: %s", string(data))
}
