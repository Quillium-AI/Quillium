package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api/restapi/middleware"
	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
)

// GetChats returns all chats for the current user
func GetChats(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	// Get chat IDs from database
	chatIDs, err := dbConn.GetChats(userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve chats"})
		return
	}

	chats := make([]ChatSummary, 0, len(chatIDs))
	for _, chatID := range chatIDs {
		chatContent, err := dbConn.GetChatContent(chatID)
		if err != nil {
			continue // Skip chats that can't be retrieved
		}
		chats = append(chats, ChatSummary{
			ID:    chatID,
			Title: chatContent.Title,
		})
	}

	// Return chat summaries
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(chats)
}

// CreateChat creates a new chat for the current user
func CreateChat(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	// Parse request body
	var chatContent chats.ChatContent
	if err := json.NewDecoder(r.Body).Decode(&chatContent); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	// Validate chat content
	if chatContent.Title == "" {
		chatContent.Title = "New Chat" // Default title if none provided
	}

	// Create chat in database
	err := dbConn.CreateChat(userID, &chatContent)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create chat"})
		return
	}

	// Get the newly created chat ID
	chatIDs, err := dbConn.GetChats(userID)
	if err != nil || len(chatIDs) == 0 {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Chat created successfully"})
		return
	}

	// Return the new chat ID (assuming the most recent chat is the one we just created)
	newestChatID := chatIDs[len(chatIDs)-1]
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Chat created successfully",
		"chat_id": newestChatID,
	})
}

// DeleteChat deletes a chat for the current user
func DeleteChat(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	// Get chat ID from query parameter
	chatIDStr := r.URL.Query().Get("id")
	if chatIDStr == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Chat ID is required"})
		return
	}

	chatID, err := strconv.Atoi(chatIDStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid chat ID"})
		return
	}

	// Verify the chat belongs to the user
	chatIDs, err := dbConn.GetChats(userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to verify chat ownership"})
		return
	}

	chatBelongsToUser := false
	for _, id := range chatIDs {
		if id == chatID {
			chatBelongsToUser = true
			break
		}
	}

	if !chatBelongsToUser {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "You don't have permission to delete this chat"})
		return
	}

	// Delete the chat
	err = dbConn.DeleteChat(chatID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete chat"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Chat deleted successfully"})
}
