package db

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
	"github.com/Quillium-AI/Quillium/src/backend/internal/settings"
	"github.com/Quillium-AI/Quillium/src/backend/internal/user"
	"github.com/jackc/pgx/v5/pgxpool"
)

// checkDBConnection attempts to connect to the test database
// Returns true if connection is successful, false otherwise
func checkDBConnection(t *testing.T) bool {
	// Use a test database URL from environment variable or default to a test database
	testDBURL := os.Getenv("TEST_DATABASE_URL")
	if testDBURL == "" {
		// Try different host options to handle Docker networking
		hosts := []string{
			"postgresql://postgres:postgres@localhost:5432/quillium_test",
			"postgresql://postgres:postgres@host.docker.internal:5432/quillium_test",
			"postgresql://postgres:postgres@127.0.0.1:5432/quillium_test",
		}

		// Try each host until one works
		for _, host := range hosts {
			t.Logf("Trying to connect to %s", host)
			if tryConnection(t, host) {
				testDBURL = host
				break
			}
		}

		// If none worked, return false
		if testDBURL == "" {
			return false
		}
	}

	return tryConnection(t, testDBURL)
}

// tryConnection attempts to connect to a specific database URL
func tryConnection(t *testing.T, dbURL string) bool {
	// Try to establish a connection with a short timeout
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	conn, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		t.Logf("Could not connect to test database at %s: %v", dbURL, err)
		return false
	}
	defer conn.Close()

	// Ping the database to verify the connection
	err = conn.Ping(ctx)
	if err != nil {
		t.Logf("Could not ping test database at %s: %v", dbURL, err)
		return false
	}

	t.Logf("Successfully connected to test database at %s", dbURL)
	return true
}

// shouldRunDBTests checks if database tests should be run
func shouldRunDBTests(t *testing.T) bool {
	// Skip if explicitly disabled
	if os.Getenv("SKIP_DB_TESTS") == "true" {
		t.Skip("Skipping database test as SKIP_DB_TESTS=true")
		return false
	}

	// Check if we can connect to the database
	if !checkDBConnection(t) {
		t.Skip("Skipping database test as no test database is available")
		return false
	}

	return true
}

// setupTestDB sets up a test database connection
// This approach assumes a test database is running and accessible
func setupTestDB(t *testing.T) *DB {
	// Use a test database URL from environment variable or default to a test database
	testDBURL := os.Getenv("TEST_DATABASE_URL")
	if testDBURL == "" {
		testDBURL = "postgresql://postgres:postgres@host.docker.internal:5432/quillium_test"
	}

	// Override the DATABASE_URL environment variable temporarily
	originalDBURL := os.Getenv("DATABASE_URL")
	os.Setenv("DATABASE_URL", testDBURL)

	// Initialize the test database
	db, err := Initialize()
	if err != nil {
		t.Fatalf("Failed to initialize test database: %v", err)
	}

	// Explicitly create all tables using the same function used in production
	err = CreateTables(db.Conn)
	if err != nil {
		t.Fatalf("Failed to create tables: %v", err)
	}

	// Clean up the test database
	cleanupTestDB(t, db)

	// Set up encryption for tests
	err = security.InitEncryption([]byte("12345678901234567890123456789012"))
	if err != nil {
		t.Fatalf("Failed to initialize encryption: %v", err)
	}

	// Reset the original DATABASE_URL after test
	t.Cleanup(func() {
		os.Setenv("DATABASE_URL", originalDBURL)
		db.Close()
	})

	return db
}

// cleanupTestDB cleans up the test database by truncating all tables
func cleanupTestDB(t *testing.T, db *DB) {
	// List of tables to truncate
	tables := []string{"users", "sso_logins", "admin_settings", "user_settings", "chat_contents"}

	// Truncate each table
	for _, table := range tables {
		_, err := db.Exec(context.Background(), "TRUNCATE TABLE "+table+" CASCADE")
		if err != nil {
			t.Logf("Warning: Failed to truncate table %s: %v", table, err)
		}
	}
}

// TestGetUser tests the GetUser function
func TestGetUser(t *testing.T) {
	// Skip this test if we don't want to run database tests
	if !shouldRunDBTests(t) {
		return
	}

	// Set up test database
	db := setupTestDB(t)

	// Create a test user
	testEmail := "test@example.com"
	testPassword := "password123"
	hashedPassword, err := security.HashPassword(testPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	testUser := &user.User{
		Email:        testEmail,
		PasswordHash: hashedPassword,
		IsSso:        false,
		IsAdmin:      false,
	}

	// Insert the test user
	_, err = db.CreateUser(testUser)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Test GetUser
	retrievedUser, err := db.GetUser(&testEmail, nil)
	if err != nil {
		t.Fatalf("GetUser returned error: %v", err)
	}

	// Verify the retrieved user
	if retrievedUser == nil {
		t.Fatal("GetUser returned nil user")
	}

	if retrievedUser.Email != testEmail {
		t.Errorf("Expected email %s, got %s", testEmail, retrievedUser.Email)
	}

	if retrievedUser.IsSso != false {
		t.Errorf("Expected IsSso to be false, got %v", retrievedUser.IsSso)
	}

	if retrievedUser.IsAdmin != false {
		t.Errorf("Expected IsAdmin to be false, got %v", retrievedUser.IsAdmin)
	}

	// Test password validation
	isValid := retrievedUser.ValidatePassword(testPassword)
	if !isValid {
		t.Error("Password validation failed")
	}
}

// TestAdminExists tests the AdminExists function
func TestAdminExists(t *testing.T) {
	// Skip this test if we don't want to run database tests
	if !shouldRunDBTests(t) {
		return
	}

	// Set up test database
	db := setupTestDB(t)

	// Initially, there should be no admin
	exists, err := db.AdminExists()
	if err != nil {
		t.Fatalf("AdminExists returned error: %v", err)
	}

	if exists {
		t.Error("Expected no admin to exist initially, but AdminExists returned true")
	}

	// Create an admin user
	adminEmail := "admin@example.com"
	adminPassword := "adminpass"
	hashedPassword, err := security.HashPassword(adminPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	adminUser := &user.User{
		Email:        adminEmail,
		PasswordHash: hashedPassword,
		IsSso:        false,
		IsAdmin:      true,
	}

	// Insert the admin user
	_, err = db.CreateUser(adminUser)
	if err != nil {
		t.Fatalf("Failed to create admin user: %v", err)
	}

	// Now there should be an admin
	exists, err = db.AdminExists()
	if err != nil {
		t.Fatalf("AdminExists returned error: %v", err)
	}

	if !exists {
		t.Error("Expected admin to exist after creation, but AdminExists returned false")
	}
}

// TestCreateUser tests the CreateUser function
func TestCreateUser(t *testing.T) {
	// Skip this test if we don't want to run database tests
	if !shouldRunDBTests(t) {
		return
	}

	// Set up test database
	db := setupTestDB(t)

	// Create a test user
	testEmail := "createuser@example.com"
	testPassword := "userpass"
	hashedPassword, err := security.HashPassword(testPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	testUser := &user.User{
		Email:        testEmail,
		PasswordHash: hashedPassword,
		IsSso:        false,
		IsAdmin:      false,
	}

	// Insert the test user
	_, err = db.CreateUser(testUser)
	if err != nil {
		t.Fatalf("CreateUser returned error: %v", err)
	}

	// Verify the user was created by retrieving it
	retrievedUser, err := db.GetUser(&testEmail, nil)
	if err != nil {
		t.Fatalf("Failed to retrieve created user: %v", err)
	}

	if retrievedUser == nil {
		t.Fatal("Retrieved user is nil after creation")
	}

	if retrievedUser.Email != testEmail {
		t.Errorf("Expected email %s, got %s", testEmail, retrievedUser.Email)
	}

	// Test creating a duplicate user (should fail)
	_, err = db.CreateUser(testUser)
	if err == nil {
		t.Error("Expected error when creating duplicate user, but got nil")
	}
}

// TestUserSettings tests the GetUserSettings and UpdateUserSettings functions
func TestUserSettings(t *testing.T) {
	// Skip this test if we don't want to run database tests
	if !shouldRunDBTests(t) {
		return
	}

	// Set up test database
	db := setupTestDB(t)

	// Create a test user first
	testEmail := "usersettings@example.com"
	testPassword := "password123"
	hashedPassword, err := security.HashPassword(testPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	testUser := &user.User{
		Email:        testEmail,
		PasswordHash: hashedPassword,
		IsSso:        false,
		IsAdmin:      false,
	}

	// Insert the test user
	_, err = db.CreateUser(testUser)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Get the user to retrieve the user ID
	// Since the User struct doesn't have an ID field, we need to query the database directly
	var userId int
	query := "SELECT id FROM users WHERE email = $1"
	err = db.QueryRow(context.Background(), query, testEmail).Scan(&userId)
	if err != nil {
		t.Fatalf("Failed to get user ID: %v", err)
	}

	// Create test user settings
	testSettings := &settings.UserSettings{
		IsDarkMode: true,
	}

	// Update the user settings
	err = db.UpdateUserSettings(userId, testSettings)
	if err != nil {
		t.Fatalf("Failed to update user settings: %v", err)
	}

	// Retrieve the updated settings
	updatedSettings, err := db.GetUserSettings(userId)
	if err != nil {
		t.Fatalf("Failed to get user settings: %v", err)
	}

	// Verify the settings were updated correctly
	if updatedSettings.IsDarkMode != testSettings.IsDarkMode {
		t.Errorf("Expected IsDarkMode %v, got %v", testSettings.IsDarkMode, updatedSettings.IsDarkMode)
	}

	// Test updating existing settings
	testSettings.IsDarkMode = false

	err = db.UpdateUserSettings(userId, testSettings)
	if err != nil {
		t.Fatalf("Failed to update existing user settings: %v", err)
	}

	// Retrieve the updated settings again
	updatedSettings, err = db.GetUserSettings(userId)
	if err != nil {
		t.Fatalf("Failed to get updated user settings: %v", err)
	}

	// Verify the settings were updated correctly
	if updatedSettings.IsDarkMode != false {
		t.Errorf("Expected updated IsDarkMode 'false', got %v", updatedSettings.IsDarkMode)
	}
}

// TestAdminSettings tests the GetAdminSettings, UpdateAdminSettings, and CreateAdminSettings functions
func TestAdminSettings(t *testing.T) {
	// Skip this test if we don't want to run database tests
	if !shouldRunDBTests(t) {
		return
	}

	// Set up test database
	db := setupTestDB(t)

	// Create test admin settings
	testSettings := &settings.AdminSettings{
		FirecrawlBaseURL:        "https://api.firecrawl.dev",
		FirecrawlAPIKey_encrypt: "encrypted_key_1",
		OpenAIBaseURL:           "https://api.openai.com",
		OpenAIAPIKey_encrypt:    "encrypted_key_2",
		LLMProfileSpeed:         "gpt-3.5-turbo",
		LLMProfileBalanced:      "gpt-4",
		LLMProfileQuality:       "gpt-4-turbo",
		EnableSignUps:           true,
	}

	// Create the admin settings
	err := db.CreateAdminSettings(testSettings)
	if err != nil {
		t.Fatalf("Failed to create admin settings: %v", err)
	}

	// Retrieve the created settings
	createdSettings, err := db.GetAdminSettings()
	if err != nil {
		t.Fatalf("Failed to get admin settings: %v", err)
	}

	// Verify the settings were created correctly
	if createdSettings.FirecrawlBaseURL != testSettings.FirecrawlBaseURL {
		t.Errorf("Expected FirecrawlBaseURL %v, got %v",
			testSettings.FirecrawlBaseURL, createdSettings.FirecrawlBaseURL)
	}

	if createdSettings.OpenAIBaseURL != testSettings.OpenAIBaseURL {
		t.Errorf("Expected OpenAIBaseURL %v, got %v",
			testSettings.OpenAIBaseURL, createdSettings.OpenAIBaseURL)
	}

	if createdSettings.LLMProfileSpeed != testSettings.LLMProfileSpeed {
		t.Errorf("Expected LLMProfileSpeed %v, got %v",
			testSettings.LLMProfileSpeed, createdSettings.LLMProfileSpeed)
	}

	if createdSettings.EnableSignUps != testSettings.EnableSignUps {
		t.Errorf("Expected EnableSignUps %v, got %v",
			testSettings.EnableSignUps, createdSettings.EnableSignUps)
	}

	// Test updating existing settings
	testSettings.EnableSignUps = false
	testSettings.LLMProfileQuality = "gpt-4-32k"

	err = db.UpdateAdminSettings(testSettings)
	if err != nil {
		t.Fatalf("Failed to update admin settings: %v", err)
	}

	// Retrieve the updated settings
	updatedSettings, err := db.GetAdminSettings()
	if err != nil {
		t.Fatalf("Failed to get updated admin settings: %v", err)
	}

	// Verify the settings were updated correctly
	if updatedSettings.EnableSignUps != false {
		t.Errorf("Expected updated EnableSignUps 'false', got %v", updatedSettings.EnableSignUps)
	}

	if updatedSettings.LLMProfileQuality != "gpt-4-32k" {
		t.Errorf("Expected updated LLMProfileQuality 'gpt-4-32k', got %s", updatedSettings.LLMProfileQuality)
	}
}

// TestChatFunctions tests the CreateChat, GetChats, GetChatContent, and UpdateChatContent functions
func TestChatFunctions(t *testing.T) {
	// Skip this test if we don't want to run database tests
	if !shouldRunDBTests(t) {
		return
	}

	// Set up test database
	db := setupTestDB(t)

	// Create a test user first
	testEmail := "chatuser@example.com"
	testPassword := "password123"
	hashedPassword, err := security.HashPassword(testPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	testUser := &user.User{
		Email:        testEmail,
		PasswordHash: hashedPassword,
		IsSso:        false,
		IsAdmin:      false,
	}

	// Insert the test user
	_, err = db.CreateUser(testUser)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Get the user ID
	var userId int
	query := "SELECT id FROM users WHERE email = $1"
	err = db.QueryRow(context.Background(), query, testEmail).Scan(&userId)
	if err != nil {
		t.Fatalf("Failed to get user ID: %v", err)
	}

	// Create a test chat
	testChat := &chats.ChatContent{
		Title: "Test Chat",
		Messages: []chats.Message{
			{
				Role:    "user",
				Content: "Hello, how are you?",
			},
			{
				Role:    "assistant",
				Content: "I'm doing well, thank you for asking!",
			},
		},
	}

	// Create the chat
	err = db.CreateChat(userId, testChat)
	if err != nil {
		t.Fatalf("Failed to create chat: %v", err)
	}

	// Get the chat IDs for the user
	chatIds, err := db.GetChats(userId)
	if err != nil {
		t.Fatalf("Failed to get chat IDs: %v", err)
	}

	// Verify we have at least one chat
	if len(chatIds) == 0 {
		t.Fatal("Expected at least one chat ID, got none")
	}

	// Get the first chat's content
	chatId := chatIds[0]
	retrievedChat, err := db.GetChatContent(chatId)
	if err != nil {
		t.Fatalf("Failed to get chat content: %v", err)
	}

	// Verify the chat content
	if retrievedChat.Title != testChat.Title {
		t.Errorf("Expected chat title %s, got %s", testChat.Title, retrievedChat.Title)
	}

	if len(retrievedChat.Messages) != len(testChat.Messages) {
		t.Errorf("Expected %d messages, got %d", len(testChat.Messages), len(retrievedChat.Messages))
	}

	if len(retrievedChat.Messages) > 0 {
		if retrievedChat.Messages[0].Role != testChat.Messages[0].Role {
			t.Errorf("Expected first message role %s, got %s",
				testChat.Messages[0].Role, retrievedChat.Messages[0].Role)
		}

		if retrievedChat.Messages[0].Content != testChat.Messages[0].Content {
			t.Errorf("Expected first message content %s, got %s",
				testChat.Messages[0].Content, retrievedChat.Messages[0].Content)
		}
	}

	// Update the chat content
	testChat.Title = "Updated Test Chat"
	testChat.Messages = append(testChat.Messages, chats.Message{
		Role:    "user",
		Content: "What's the weather like today?",
	})

	err = db.UpdateChatContent(chatId, testChat)
	if err != nil {
		t.Fatalf("Failed to update chat content: %v", err)
	}

	// Get the updated chat content
	updatedChat, err := db.GetChatContent(chatId)
	if err != nil {
		t.Fatalf("Failed to get updated chat content: %v", err)
	}

	// Verify the updated chat content
	if updatedChat.Title != "Updated Test Chat" {
		t.Errorf("Expected updated chat title 'Updated Test Chat', got %s", updatedChat.Title)
	}

	if len(updatedChat.Messages) != 3 {
		t.Errorf("Expected 3 messages after update, got %d", len(updatedChat.Messages))
	}

	// Test deleting the chat
	err = db.DeleteChat(chatId)
	if err != nil {
		t.Fatalf("Failed to delete chat: %v", err)
	}

	// Verify the chat was deleted
	chatIds, err = db.GetChats(userId)
	if err != nil {
		t.Fatalf("Failed to get chat IDs after deletion: %v", err)
	}

	for _, id := range chatIds {
		if id == chatId {
			t.Errorf("Chat with ID %d still exists after deletion", chatId)
		}
	}
}

// TestUserApikeys tests the CreateUserApikey, GetUserByApikey, and DeleteUserApikey functions
func TestUserApikeys(t *testing.T) {
	// Skip this test if we don't want to run database tests
	if !shouldRunDBTests(t) {
		return
	}

	// Set up test database
	db := setupTestDB(t)

	// Create a test user first
	testEmail := "apikey_user@example.com"
	testPassword := "password123"
	hashedPassword, err := security.HashPassword(testPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	testUser := &user.User{
		Email:        testEmail,
		PasswordHash: hashedPassword,
		IsSso:        false,
		IsAdmin:      false,
	}

	// Insert the test user
	userId, err := db.CreateUser(testUser)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Update the user with the returned ID
	testUser.ID = userId

	// Create a test API key (in a real scenario, this would be encrypted)
	testApiKey := "test_api_key_123"

	// Test CreateUserApikey
	err = db.CreateUserApikey(testUser, testApiKey)
	if err != nil {
		t.Fatalf("CreateUserApikey returned error: %v", err)
	}

	// Test GetUserByApikey
	retrievedUserId, err := db.GetUserByApikey(testApiKey)
	if err != nil {
		t.Fatalf("GetUserByApikey returned error: %v", err)
	}

	// Verify the retrieved user ID
	if retrievedUserId != *testUser.ID {
		t.Errorf("Expected user ID %d, got %d", *testUser.ID, retrievedUserId)
	}

	// Test creating multiple API keys for the same user
	testApiKey2 := "test_api_key_2"
	err = db.CreateUserApikey(testUser, testApiKey2)
	if err != nil {
		t.Fatalf("Failed to create second API key: %v", err)
	}

	// Verify both API keys can be retrieved
	retrievedUserId, err = db.GetUserByApikey(testApiKey)
	if err != nil {
		t.Fatalf("Failed to get first API key: %v", err)
	}
	if retrievedUserId != *testUser.ID {
		t.Errorf("Expected user ID %d for first API key, got %d", *testUser.ID, retrievedUserId)
	}

	retrievedUserId, err = db.GetUserByApikey(testApiKey2)
	if err != nil {
		t.Fatalf("Failed to get second API key: %v", err)
	}
	if retrievedUserId != *testUser.ID {
		t.Errorf("Expected user ID %d for second API key, got %d", *testUser.ID, retrievedUserId)
	}

	// Test DeleteUserApikey
	err = db.DeleteUserApikey(testUser, testApiKey)
	if err != nil {
		t.Fatalf("DeleteUserApikey returned error: %v", err)
	}

	// Verify the first API key was deleted by trying to retrieve it (should fail)
	_, err = db.GetUserByApikey(testApiKey)
	if err == nil {
		t.Error("Expected error when getting deleted API key, but got nil")
	}

	// The second API key should still be valid
	retrievedUserId, err = db.GetUserByApikey(testApiKey2)
	if err != nil {
		t.Fatalf("Failed to get second API key after deleting first: %v", err)
	}
	if retrievedUserId != *testUser.ID {
		t.Errorf("Expected user ID %d for second API key, got %d", *testUser.ID, retrievedUserId)
	}

	// Create a second test user
	testEmail2 := "apikey_user2@example.com"
	testUser2 := &user.User{
		Email:        testEmail2,
		PasswordHash: hashedPassword, // Reuse the same password hash for simplicity
		IsSso:        false,
		IsAdmin:      false,
	}

	// Insert the second test user
	userId2, err := db.CreateUser(testUser2)
	if err != nil {
		t.Fatalf("Failed to create second test user: %v", err)
	}

	// Update the second user with the returned ID
	testUser2.ID = userId2

	// Create an API key for the second user
	testApiKey3 := "test_api_key_3"
	err = db.CreateUserApikey(testUser2, testApiKey3)
	if err != nil {
		t.Fatalf("Failed to create API key for second user: %v", err)
	}

	// Verify both users' API keys can be retrieved correctly
	retrievedUserId, err = db.GetUserByApikey(testApiKey2) // First user's remaining key
	if err != nil {
		t.Fatalf("Failed to get first user's API key: %v", err)
	}
	if retrievedUserId != *testUser.ID {
		t.Errorf("Expected user ID %d for first user's API key, got %d", *testUser.ID, retrievedUserId)
	}

	retrievedUserId, err = db.GetUserByApikey(testApiKey3) // Second user's key
	if err != nil {
		t.Fatalf("Failed to get second user's API key: %v", err)
	}
	if retrievedUserId != *testUser2.ID {
		t.Errorf("Expected user ID %d for second user's API key, got %d", *testUser2.ID, retrievedUserId)
	}
}

// TestGetUserApikeys tests the GetUserApikeys function
func TestGetUserApikeys(t *testing.T) {
	// Skip this test if we don't want to run database tests
	if !shouldRunDBTests(t) {
		return
	}

	// Set up test database
	db := setupTestDB(t)

	// Create a test user
	testEmail := "apikeys_user@example.com"
	testPassword := "password123"
	hashedPassword, err := security.HashPassword(testPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	testUser := &user.User{
		Email:        testEmail,
		PasswordHash: hashedPassword,
		IsSso:        false,
		IsAdmin:      false,
	}

	// Insert the test user
	userId, err := db.CreateUser(testUser)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Update the user with the returned ID
	testUser.ID = userId

	// Initially, the user should have no API keys
	apiKeys, err := db.GetUserApikeys(testUser)
	if err != nil {
		t.Fatalf("GetUserApikeys returned error: %v", err)
	}

	if len(apiKeys) != 0 {
		t.Errorf("Expected 0 API keys initially, got %d", len(apiKeys))
	}

	// Create multiple API keys for the user
	testApiKeys := []string{
		"test_apikey_get_1",
		"test_apikey_get_2",
		"test_apikey_get_3",
	}

	// Add each API key
	for _, key := range testApiKeys {
		err = db.CreateUserApikey(testUser, key)
		if err != nil {
			t.Fatalf("Failed to create API key '%s': %v", key, err)
		}
	}

	// Now the user should have multiple API keys
	apiKeys, err = db.GetUserApikeys(testUser)
	if err != nil {
		t.Fatalf("GetUserApikeys returned error after creating keys: %v", err)
	}

	// Verify we have the expected number of keys
	if len(apiKeys) != len(testApiKeys) {
		t.Errorf("Expected %d API keys after creation, got %d", len(testApiKeys), len(apiKeys))
	}

	// Verify all keys are present
	keyMap := make(map[string]bool)
	for _, key := range apiKeys {
		keyMap[key] = true
	}

	for _, expectedKey := range testApiKeys {
		if !keyMap[expectedKey] {
			t.Errorf("Expected API key '%s' not found in results", expectedKey)
		}
	}

	// Delete one API key
	keyToDelete := testApiKeys[1] // Delete the middle key
	err = db.DeleteUserApikey(testUser, keyToDelete)
	if err != nil {
		t.Fatalf("Failed to delete API key: %v", err)
	}

	// The user should now have one less API key
	apiKeys, err = db.GetUserApikeys(testUser)
	if err != nil {
		t.Fatalf("GetUserApikeys returned error after deletion: %v", err)
	}

	if len(apiKeys) != len(testApiKeys)-1 {
		t.Errorf("Expected %d API keys after deletion, got %d", len(testApiKeys)-1, len(apiKeys))
	}

	// Verify the deleted key is not present
	keyMap = make(map[string]bool)
	for _, key := range apiKeys {
		keyMap[key] = true
	}

	if keyMap[keyToDelete] {
		t.Errorf("Deleted API key '%s' still found in results", keyToDelete)
	}

	// Verify the other keys are still present
	for i, expectedKey := range testApiKeys {
		if i != 1 && !keyMap[expectedKey] { // Skip the deleted key (index 1)
			t.Errorf("Expected API key '%s' not found in results after deletion of another key", expectedKey)
		}
	}
}
