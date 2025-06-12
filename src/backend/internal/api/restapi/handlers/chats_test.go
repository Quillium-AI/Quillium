package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"

	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/api/restapi/handlers"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/api/restapi/middleware"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/chats"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/db"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/user"
)

// Setup test database
func setupTestDB(t *testing.T) *db.DB {
	// Use test database URL from environment or default to test database
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/quillium_test"
		os.Setenv("DATABASE_URL", dbURL)
	}

	// Initialize database
	testDB, err := db.Initialize()
	if err != nil {
		t.Fatalf("Failed to initialize test database: %v", err)
	}

	return testDB
}

// Setup test context with user ID
func setupUserContext(userID int) context.Context {
	ctx := context.Background()
	return context.WithValue(ctx, middleware.UserIDKey(), userID)
}

// Create a test user for chat tests
func createTestUser(t *testing.T, testDB *db.DB) int {
	// Create a test user
	testUser := &user.User{
		Email:        "chattest@example.com",
		PasswordHash: new(string),
		IsAdmin:      false,
		IsSso:        false,
	}
	*testUser.PasswordHash = "hashedpassword"

	userID, err := testDB.CreateUser(testUser)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	return *userID
}

func TestGetChats(t *testing.T) {
	// Skip if not in integration test mode
	if os.Getenv("INTEGRATION_TESTS") == "" {
		t.Skip("Skipping integration test. Set INTEGRATION_TESTS=1 to run.")
	}

	// Initialize test database
	testDB := setupTestDB(t)
	defer testDB.Close()

	// Initialize handlers with test database
	handlers.InitHandlers(testDB)

	// Create a test user
	userID := createTestUser(t, testDB)

	// Create some test chats
	chatContent1 := &chats.ChatContent{
		Title: "Test Chat 1",
		Messages: []chats.Message{
			{Role: "user", Content: "Hello"},
			{Role: "assistant", Content: "Hi there"},
		},
	}

	chatContent2 := &chats.ChatContent{
		Title: "Test Chat 2",
		Messages: []chats.Message{
			{Role: "user", Content: "How are you?"},
			{Role: "assistant", Content: "I'm doing well, thanks!"},
		},
	}

	err := testDB.CreateChat(userID, chatContent1)
	if err != nil {
		t.Fatalf("Failed to create test chat 1: %v", err)
	}

	err = testDB.CreateChat(userID, chatContent2)
	if err != nil {
		t.Fatalf("Failed to create test chat 2: %v", err)
	}

	// Create request with user context
	req := httptest.NewRequest("GET", "/api/user/chats", nil)
	req = req.WithContext(setupUserContext(userID))
	rec := httptest.NewRecorder()

	// Call the handler
	handlers.GetChats(rec, req)

	// Check response
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, rec.Code)
	}

	// Parse response body
	var response []handlers.ChatSummary
	err = json.Unmarshal(rec.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify response
	if len(response) < 2 {
		t.Errorf("Expected at least 2 chats, got %d", len(response))
	}

	// Clean up - delete the test chats
	chatIDs, _ := testDB.GetChats(userID)
	for _, chatID := range chatIDs {
		testDB.DeleteChat(chatID)
	}
}

func TestCreateChat(t *testing.T) {
	// Skip if not in integration test mode
	if os.Getenv("INTEGRATION_TESTS") == "" {
		t.Skip("Skipping integration test. Set INTEGRATION_TESTS=1 to run.")
	}

	// Initialize test database
	testDB := setupTestDB(t)
	defer testDB.Close()

	// Initialize handlers with test database
	handlers.InitHandlers(testDB)

	// Create a test user
	userID := createTestUser(t, testDB)

	// Create test data
	chatContent := chats.ChatContent{
		Title: "New Test Chat",
		Messages: []chats.Message{
			{Role: "user", Content: "This is a test message"},
		},
	}

	// Create request with user context
	body, _ := json.Marshal(chatContent)
	req := httptest.NewRequest("POST", "/api/user/chat/create", bytes.NewBuffer(body))
	req = req.WithContext(setupUserContext(userID))
	rec := httptest.NewRecorder()

	// Call the handler
	handlers.CreateChat(rec, req)

	// Check response
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, rec.Code)
	}

	// Verify chat was created
	chatIDs, err := testDB.GetChats(userID)
	if err != nil {
		t.Fatalf("Failed to get chats: %v", err)
	}

	if len(chatIDs) == 0 {
		t.Errorf("Expected at least 1 chat, got none")
	}

	// Clean up - delete the test chats
	for _, chatID := range chatIDs {
		testDB.DeleteChat(chatID)
	}
}

func TestDeleteChat(t *testing.T) {
	// Skip if not in integration test mode
	if os.Getenv("INTEGRATION_TESTS") == "" {
		t.Skip("Skipping integration test. Set INTEGRATION_TESTS=1 to run.")
	}

	// Initialize test database
	testDB := setupTestDB(t)
	defer testDB.Close()

	// Initialize handlers with test database
	handlers.InitHandlers(testDB)

	// Create a test user
	userID := createTestUser(t, testDB)

	// Create a test chat
	chatContent := &chats.ChatContent{
		Title: "Test Chat for Deletion",
		Messages: []chats.Message{
			{Role: "user", Content: "Delete me"},
		},
	}

	err := testDB.CreateChat(userID, chatContent)
	if err != nil {
		t.Fatalf("Failed to create test chat: %v", err)
	}

	// Get the chat ID
	chatIDs, err := testDB.GetChats(userID)
	if err != nil || len(chatIDs) == 0 {
		t.Fatalf("Failed to get chat ID: %v", err)
	}

	chatID := chatIDs[0]

	// Create request with user context and chat ID
	req := httptest.NewRequest("DELETE", "/api/user/chat/delete?id="+strconv.Itoa(chatID), nil)
	req = req.WithContext(setupUserContext(userID))
	rec := httptest.NewRecorder()

	// Call the handler
	handlers.DeleteChat(rec, req)

	// Check response
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, rec.Code)
	}

	// Verify chat was deleted
	chatIDs, _ = testDB.GetChats(userID)
	for _, id := range chatIDs {
		if id == chatID {
			t.Errorf("Expected chat %d to be deleted, but it still exists", chatID)
		}
	}
}
