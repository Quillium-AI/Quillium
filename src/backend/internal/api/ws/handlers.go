package ws

import (
	"encoding/json"
	"log"
)

// Message represents a message sent between clients
type Message struct {
	Type    string `json:"type"`
	Content string `json:"content"`
	Sender  string `json:"sender,omitempty"`
}

// HandleMessage processes incoming WebSocket messages
func HandleMessage(hub *Hub, data []byte) {
	// For now, just log the message and broadcast it back
	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Printf("Error parsing message: %v", err)
		return
	}

	log.Printf("Received message: %s", data)

	// Echo the message back to all clients
	hub.broadcast <- data
}
