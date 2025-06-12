package chats

import (
	"encoding/json"
	"testing"
)

func TestChatContentToJSON(t *testing.T) {
	// Create a sample chat content
	chatContent := &ChatContent{
		Title: "Test Chat",
		Messages: []Message{
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

	// Convert to JSON
	jsonStr, err := chatContent.ToJSON()
	if err != nil {
		t.Fatalf("Failed to convert chat content to JSON: %v", err)
	}

	// Verify JSON string is not empty
	if jsonStr == "" {
		t.Error("JSON string is empty")
	}

	// Parse the JSON string back to verify contents
	var result map[string]interface{}
	err = json.Unmarshal([]byte(jsonStr), &result)
	if err != nil {
		t.Fatalf("Failed to parse JSON string: %v", err)
	}

	// Verify key fields are present
	if result["title"] != chatContent.Title {
		t.Errorf("Expected title to be %s, got %s",
			chatContent.Title, result["title"])
	}

	// Verify messages array exists
	messages, ok := result["messages"].([]interface{})
	if !ok {
		t.Fatal("Messages field is not an array")
	}

	// Verify message count
	if len(messages) != len(chatContent.Messages) {
		t.Errorf("Expected %d messages, got %d",
			len(chatContent.Messages), len(messages))
	}

	// Verify first message
	if len(messages) > 0 {
		firstMessage, ok := messages[0].(map[string]interface{})
		if !ok {
			t.Fatal("First message is not a map")
		}

		if firstMessage["role"] != chatContent.Messages[0].Role {
			t.Errorf("Expected first message role to be %s, got %s",
				chatContent.Messages[0].Role, firstMessage["role"])
		}

		if firstMessage["content"] != chatContent.Messages[0].Content {
			t.Errorf("Expected first message content to be %s, got %s",
				chatContent.Messages[0].Content, firstMessage["content"])
		}
	}
}

func TestChatContentFromJSON(t *testing.T) {
	// Create a JSON string
	jsonStr := `{
		"title": "Test Chat",
		"messages": [
			{
				"role": "user",
				"content": "Hello, how are you?"
			},
			{
				"role": "assistant",
				"content": "I'm doing well, thank you for asking!"
			}
		]
	}`

	// Create an empty chat content
	chatContent := &ChatContent{}

	// Parse the JSON string
	result, err := chatContent.FromJSON(jsonStr)
	if err != nil {
		t.Fatalf("Failed to parse JSON string: %v", err)
	}

	// Verify the parsed values
	if result.Title != "Test Chat" {
		t.Errorf("Expected Title to be %s, got %s",
			"Test Chat", result.Title)
	}

	// Verify message count
	if len(result.Messages) != 2 {
		t.Errorf("Expected 2 messages, got %d", len(result.Messages))
	}

	// Verify first message
	if len(result.Messages) > 0 {
		if result.Messages[0].Role != "user" {
			t.Errorf("Expected first message role to be %s, got %s",
				"user", result.Messages[0].Role)
		}

		if result.Messages[0].Content != "Hello, how are you?" {
			t.Errorf("Expected first message content to be %s, got %s",
				"Hello, how are you?", result.Messages[0].Content)
		}
	}

	// Verify second message
	if len(result.Messages) > 1 {
		if result.Messages[1].Role != "assistant" {
			t.Errorf("Expected second message role to be %s, got %s",
				"assistant", result.Messages[1].Role)
		}

		if result.Messages[1].Content != "I'm doing well, thank you for asking!" {
			t.Errorf("Expected second message content to be %s, got %s",
				"I'm doing well, thank you for asking!", result.Messages[1].Content)
		}
	}
}

// Test with invalid JSON
func TestChatContentFromJSONInvalid(t *testing.T) {
	// Create an invalid JSON string
	jsonStr := `{"title": "Test Chat", invalid json}`

	// Create an empty chat content
	chatContent := &ChatContent{}

	// Parse the JSON string
	_, err := chatContent.FromJSON(jsonStr)
	if err == nil {
		t.Error("Expected error when parsing invalid JSON, but got nil")
	}
}
