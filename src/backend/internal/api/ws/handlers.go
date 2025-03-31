package ws

import (
	"encoding/json"
	"log"
)

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
