package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/api/restapi/middleware"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/chats"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/elasticsearch"
	llmproviders "gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/llm_providers"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/security"
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

// HandleChat handles chat message streaming via SSE
func HandleChat(w http.ResponseWriter, r *http.Request) {
	// Only handle SSE requests
	if r.Header.Get("Accept") != "text/event-stream" {
		http.Error(w, "SSE required", http.StatusBadRequest)
		return
	}
	handleSSE(w, r)
}

func handleSSE(w http.ResponseWriter, r *http.Request) {
	// Set headers for SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// Parse request body
	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Convert chatID to int
	chatIDInt, err := strconv.Atoi(req.ChatID)
	if err != nil {
		http.Error(w, "Invalid chat ID", http.StatusBadRequest)
		return
	}

	// Get the chat content from the database
	chat, err := dbConn.GetChatContent(chatIDInt)
	if err != nil {
		http.Error(w, "Failed to get chat", http.StatusInternalServerError)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Verify user owns this chat
	chatBelongsToUser, err := dbConn.VerifyChatOwnership(chatIDInt, userID)
	if err != nil {
		http.Error(w, "Failed to verify chat ownership", http.StatusInternalServerError)
		return
	}

	if !chatBelongsToUser {
		http.Error(w, "Chat not found", http.StatusNotFound)
		return
	}

	// Create a channel to receive chat updates
	updates := make(chan string)
	_, cancel := context.WithCancel(r.Context())
	defer cancel()

	// Start processing the chat in a goroutine
	go func() {
		defer close(updates)

		// Add user message to chat history
		userMessage := chats.Message{
			Role:    "user",
			Content: req.Messages[len(req.Messages)-1].Content,
			MsgNum:  len(chat.Messages) + 1,
		}

		adminSettings, err := dbConn.GetAdminSettings()
		if err != nil {
			http.Error(w, "Failed to get admin settings", http.StatusInternalServerError)
			return
		}

		// Extract model from profile
		var model string
		var limit int
		switch req.QualityProfile {
			case "speed":
				model = adminSettings.LLMProfileSpeed
				limit = 10
			case "balanced":
				model = adminSettings.LLMProfileBalanced
				limit = 15
			case "quality":
				model = adminSettings.LLMProfileQuality
				limit = 20
		}

		OpenAIAPIKey, err := security.DecryptPassword(adminSettings.OpenAIAPIKey_encrypt)
		if err != nil {
			http.Error(w, "Failed to decrypt API key", http.StatusInternalServerError)
			return
		}

		// Get the highest message number and increment by 1
		msgNum := 0
		if len(chat.Messages) > 0 {
			msgNum = chat.Messages[len(chat.Messages)-1].MsgNum + 1
		}
		sources, err := elasticsearch.SearchElasticSearch(dbConn, req.Query, limit, msgNum)
		if err != nil {
			http.Error(w, "Failed to search Elasticsearch", http.StatusInternalServerError)
			return
		}

		// Get AI response (streaming)
		var responseBuilder strings.Builder

		// Convert []Message to []string for strings.Join
		messageStrings := make([]string, len(chat.Messages))
		for i, msg := range chat.Messages {
			messageStrings[i] = fmt.Sprintf("%s: %s", msg.Role, msg.Content)
		}
		chathistory := fmt.Sprintf("%s\n\n", strings.Join(messageStrings, "\n"))

		_, err = llmproviders.Chat(model, chathistory, *OpenAIAPIKey, adminSettings.OpenAIBaseURL, req.Query, sources, adminSettings.FullContentEnabled, func(resp llmproviders.StreamResponse) {
			// Check for errors
			if resp.Error != nil {
				log.Printf("Streaming error: %v", resp.Error)
				return
			}

			// Add content to the response builder
			responseBuilder.WriteString(resp.Content)

			// Send the chunk to the client
			select {
			case updates <- resp.Content:
				// Successfully sent the chunk
			default:
				// Channel is blocked or closed, skip this chunk
				log.Printf("Could not send chunk to updates channel")
			}
		})

		if err != nil {
			http.Error(w, "Failed to generate AI response", http.StatusInternalServerError)
			return
		}

		// Use the complete response from the builder
		response := responseBuilder.String()
		// Add assistant message to chat history
		assistantMessage := chats.Message{
			Role:    "assistant",
			Content: response,
			MsgNum:  msgNum,
		}

		// Update chat in database
		chatContent := &chats.ChatContent{
			Title:    chat.Title,
			Messages: append(chat.Messages, userMessage, assistantMessage),
		}
		// Update the chat content in the database
		if err := dbConn.UpdateChatContent(chatIDInt, chatContent); err != nil {
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update chat"})
		}
	}()

	// Stream updates to the client
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	// Send initial empty message to establish connection
	json.NewEncoder(w).Encode(map[string]string{"event": "start", "data": ""})
	flusher.Flush()

	// Stream the response
	for content := range updates {
		// Send SSE event
		json.NewEncoder(w).Encode(map[string]string{"event": "message", "data": content})
		flusher.Flush()
	}

	// Send completion event
	json.NewEncoder(w).Encode(map[string]string{"event": "done", "data": "\"done\""})
	flusher.Flush()
}
