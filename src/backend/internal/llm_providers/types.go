package llmproviders

import "github.com/Quillium-AI/Quillium/src/backend/internal/chats"

// ChatResponse represents the structured response from the Chat function
type ChatResponse struct {
	Content          string
	RelatedQuestions *chats.RelatedQuestions
}

// StreamResponse represents a chunk of streaming response from the OpenAI API
type StreamResponse struct {
	Content          string                  // Content chunk
	Done             bool                    // Whether this is the final chunk
	RelatedQuestions *chats.RelatedQuestions // Only populated in the final chunk
	Sources          []chats.Source          // Sources for the response, only in final chunk
	Error            error                   // Any error that occurred during streaming
}
