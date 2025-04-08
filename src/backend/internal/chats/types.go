package chats

// Message represents a single message in a chat conversation
type Message struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"` // The message content
}

// RelatedQuestions represents a list of questions related to the user's query
type RelatedQuestions struct {
	Questions []string `json:"questions"` // List of related questions
}

// ChatContent represents the content of a chat with a title and messages
type ChatContent struct {
	Title            string           `json:"title"`            // Title of the chat
	Messages         []Message        `json:"messages"`         // Array of messages in the chat
	RelatedQuestions *RelatedQuestions `json:"relatedQuestions"` // Related questions for the chat
}
