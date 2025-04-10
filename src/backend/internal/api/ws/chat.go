package ws

import (
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
)

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
func (cm *ChatManager) SaveChat(chatID string) error {
	cm.mutex.RLock()
	session, exists := cm.sessions[chatID]
	cm.mutex.RUnlock()

	if !exists {
		return errors.New("chat session not found")
	}

	// Convert to ChatContent for database storage
	chatContent := &chats.ChatContent{
		Title:    "Chat Session " + chatID, // You might want to allow setting titles elsewhere
		Messages: session.Messages,
		Sources:  []chats.Source{}, // Add sources if your application uses them
	}

	// Get database connection
	dbConn, err := db.Initialize()
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer dbConn.Close()

	// Convert userID from string to int
	userID, err := strconv.Atoi(session.UserID)
	if err != nil {
		return fmt.Errorf("invalid user ID format: %w", err)
	}

	// Save to database
	err = dbConn.CreateChat(userID, chatContent)
	if err != nil {
		return fmt.Errorf("failed to save chat to database: %w", err)
	}

	log.Printf("Chat session %s saved to database", chatID)
	return nil
}

// ProcessChatRequest processes a chat request and sends responses to the client
func ProcessChatRequest(client *Client, req ChatRequest) {
	log.Printf("Processing chat request for chat ID: %s", req.ChatID)

	// Validate request
	if req.ChatID == "" {
		// Log the error and return
		log.Printf("Chat request missing chat ID")
		// Use existing error handling mechanism
		sendErrorResponse(client, "Chat ID is required")
		return
	}

	// Check if we need to load an existing chat from database
	if len(req.Messages) == 0 {
		// This might be a continuation of an existing chat
		// You could load previous messages from the database here
		chatID, err := strconv.Atoi(req.ChatID)
		if err == nil {
			dbConn, err := db.Initialize()
			if err == nil {
				defer dbConn.Close()
				chatContent, err := dbConn.GetChatContent(chatID)
				if err == nil && chatContent != nil {
					// Add messages from database to request
					req.Messages = chatContent.Messages
				}
			}
		}
	}

	processChatRequest(client, req)

	// After processing, save the chat session to the database
	// This could be done asynchronously
	go func() {
		// Add a small delay to ensure messages are processed first
		time.Sleep(time.Second)
		cm := NewChatManager()
		if err := cm.SaveChat(req.ChatID); err != nil {
			log.Printf("Error saving chat %s: %v", req.ChatID, err)
		}
	}()
}

// GetChatHistory retrieves chat history from the database
func GetChatHistory(userID string) ([]ChatSession, error) {
	// Convert userID from string to int
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	// Get database connection
	dbConn, err := db.Initialize()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	defer dbConn.Close()

	// Get chat IDs for this user
	chatIDs, err := dbConn.GetChats(userIDInt)
	if err != nil {
		return nil, fmt.Errorf("failed to get chat IDs: %w", err)
	}

	// Retrieve each chat and convert to ChatSession
	var sessions []ChatSession
	for _, chatID := range chatIDs {
		chatContent, err := dbConn.GetChatContent(chatID)
		if err != nil {
			log.Printf("Error retrieving chat %d: %v", chatID, err)
			continue
		}

		// Convert ChatContent to ChatSession
		session := ChatSession{
			ChatID:   strconv.Itoa(chatID),
			UserID:   userID,
			Messages: chatContent.Messages,
			Title:    chatContent.Title,
		}

		sessions = append(sessions, session)
	}

	return sessions, nil
}

// GetChat retrieves a specific chat session by its ID and validates that it belongs to the client
func GetChat(chatID string, client *Client) (*ChatSession, error) {
	// Convert chatID from string to int
	chatIDInt, err := strconv.Atoi(chatID)
	if err != nil {
		return nil, fmt.Errorf("invalid chat ID format: %w", err)
	}

	// Get database connection
	dbConn, err := db.Initialize()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	defer dbConn.Close()

	// Use the client's user ID from context
	userIDInt := client.userID

	// Verify that this chat belongs to the user
	isOwner, err := dbConn.VerifyChatOwnership(chatIDInt, userIDInt)
	if err != nil {
		return nil, fmt.Errorf("failed to verify chat ownership: %w", err)
	}

	if !isOwner {
		return nil, fmt.Errorf("chat %s does not belong to the current user", chatID)
	}

	// Get chat content using the existing function
	chatContent, err := dbConn.GetChatContent(chatIDInt)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve chat %s: %w", chatID, err)
	}

	// Convert ChatContent to ChatSession
	session := &ChatSession{
		ChatID:   chatID,
		UserID:   strconv.Itoa(userIDInt),
		Messages: chatContent.Messages,
		Title:    chatContent.Title,
	}

	return session, nil
}

// DeleteChat deletes a chat session
func DeleteChat(chatID string) error {
	// Convert chatID from string to int
	chatIDInt, err := strconv.Atoi(chatID)
	if err != nil {
		return fmt.Errorf("invalid chat ID format: %w", err)
	}

	// Get database connection
	dbConn, err := db.Initialize()
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer dbConn.Close()

	// Delete from database
	err = dbConn.DeleteChat(chatIDInt)
	if err != nil {
		return fmt.Errorf("failed to delete chat from database: %w", err)
	}

	// Also remove from in-memory cache if it exists
	cm := NewChatManager()
	cm.mutex.Lock()
	delete(cm.sessions, chatID)
	cm.mutex.Unlock()

	log.Printf("Chat session %s deleted from database", chatID)
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

// WebSocketMessage defines the structure of messages sent over WebSocket
type WebSocketMessage struct {
	Type    string      `json:"type"`
	Content interface{} `json:"content"`
}
