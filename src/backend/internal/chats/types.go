package chats

// Message represents a single message in a chat conversation
type Message struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"` // The message content
	MsgNum  int    `json:"msg_num"` // Message number for reference
}

// Source represents a source of information used in a response
type Source struct {
	Title       string `json:"title"`       // Title of the source
	URL         string `json:"url"`         // URL of the source
	Description string `json:"description"` // Description of the source
	MsgNum      int    `json:"msg_num"`     // Message number this source is associated with
}

// ChatContent represents the content of a chat with a title and messages
type ChatContent struct {
	Title    string    `json:"title"`    // Title of the chat
	Messages []Message `json:"messages"` // Array of messages in the chat
	Sources  []Source  `json:"sources"`  // Sources of information used in responses
}

// ChatContentWithoutSources represents just the title and messages without sources
// This is used for database storage to prevent duplicate storage of sources
type ChatContentWithoutSources struct {
	Title    string    `json:"title"`    // Title of the chat
	Messages []Message `json:"messages"` // Array of messages in the chat
}
