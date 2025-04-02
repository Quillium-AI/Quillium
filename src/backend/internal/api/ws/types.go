package ws

import (
	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
	"github.com/gorilla/websocket"
)

// Hub maintains the set of active clients and broadcasts messages to the clients
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages from the clients
	broadcast chan []byte

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client
}

// Message represents a message sent between clients
type Message struct {
	Type    string      `json:"type"`
	Content interface{} `json:"content"`
	Sender  string      `json:"sender,omitempty"`
}

// ChatMessage represents a chat message with its metadata
type ChatMessage struct {
	ChatID  string        `json:"chatId"`
	Message chats.Message `json:"message"`
}

// ChatRequest represents a request to start or continue a chat
type ChatRequest struct {
	ChatID   string          `json:"chatId,omitempty"`
	Messages []chats.Message `json:"messages"`
	Options  ChatOptions     `json:"options,omitempty"`
}

// ChatOptions represents options for a chat request
type ChatOptions struct {
	Model       string  `json:"model,omitempty"`
	Temperature float64 `json:"temperature,omitempty"`
	MaxTokens   int     `json:"maxTokens,omitempty"`
}

// ChatResponse represents a response from the AI
type ChatResponse struct {
	ChatID  string        `json:"chatId"`
	Message chats.Message `json:"message"`
	Done    bool          `json:"done"`
}

// ChatStreamResponse represents a streaming response from the AI
type ChatStreamResponse struct {
	ChatID  string `json:"chatId"`
	Content string `json:"content"`
	Done    bool   `json:"done"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// Client is a middleman between the websocket connection and the hub
type Client struct {
	hub *Hub

	// The websocket connection
	conn *websocket.Conn

	// Buffered channel of outbound messages
	send chan []byte

	// User ID associated with this client
	userID int

	// Current active chat ID
	activeChatID string
}
