package llmproviders

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

// ChatResponse represents the structured response from the Chat function
type ChatResponse struct {
	Content          string
	RelatedQuestions *chats.RelatedQuestions
}

func Chat(model string, api_key string, base_url string, query string, firecrawl_results []string) (ChatResponse, error) {
	client := openai.NewClient(
		option.WithAPIKey(api_key),
		option.WithBaseURL(base_url),
	)
	chatCompletion, err := client.Chat.Completions.New(context.TODO(), openai.ChatCompletionNewParams{
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(`You are Quillium, an advanced AI assistant designed to provide accurate, helpful, and concise responses to user queries. Your primary function is to analyze and synthesize information from multiple sources, including data retrieved from Firecrawl, to deliver precise answers.

								When responding to queries:
								1. Always prioritize accuracy over speculation. If you're uncertain about something, acknowledge the limitations of your knowledge.
								2. Include relevant citations when referencing specific information. Citations should be in the format [Source: Document Title, Page/Section].
								3. When data is provided from Firecrawl, analyze it carefully and extract the most relevant information to address the user's query.
								4. Structure your responses logically with clear sections when appropriate.
								5. Keep your answers concise and focused on the user's question.
								6. If the user's query is ambiguous, ask clarifying questions before providing a detailed response.
								7. When presenting code or technical information, ensure it is accurate, well-formatted, and includes brief explanations.
								8. If the query relates to Quillium's functionality or capabilities, provide accurate information about the system's features.

								At the end of your response, always include a section with 3-5 related questions that the user might want to ask next. Format this section as follows:

								RELATED_QUESTIONS:
								1. [First related question]
								2. [Second related question]
								3. [Third related question]
								...

								Remember that your purpose is to assist users by providing valuable, accurate information that helps them accomplish their goals efficiently.`),
			openai.UserMessage(fmt.Sprintf("Here is the Users Query: %s\n\nHere are the Firecrawl results related to the query: %s", query, strings.Join(firecrawl_results, "\n"))),
		},
		Model: model,
	})
	if err != nil {
		log.Printf("Error calling OpenAI API: %v", err)
		return ChatResponse{}, err
	}

	// Get the raw content from the AI response
	rawContent := chatCompletion.Choices[0].Message.Content

	// Extract related questions and clean the content
	cleanedContent, relatedQuestions := ExtractRelatedQuestions(rawContent)

	return ChatResponse{
		Content:          cleanedContent,
		RelatedQuestions: relatedQuestions,
	}, nil
}
