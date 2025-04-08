package llmproviders

import (
	"regexp"
	"strings"

	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
)

// ExtractRelatedQuestions parses the AI response to extract related questions
// Returns the cleaned content (without the RELATED_QUESTIONS section) and the related questions
func ExtractRelatedQuestions(content string) (string, *chats.RelatedQuestions) {
	// Check if the response contains a RELATED_QUESTIONS section
	relatedQuestionsRegex := regexp.MustCompile(`(?s)RELATED_QUESTIONS:\s*([\s\S]*?)(?:$|\n\s*\n)`)
	matches := relatedQuestionsRegex.FindStringSubmatch(content)

	if len(matches) < 2 {
		// No related questions found
		return content, nil
	}

	// Extract and clean the related questions section
	relatedQuestionsText := matches[1]
	relatedQuestionsLines := strings.Split(strings.TrimSpace(relatedQuestionsText), "\n")

	// Extract the questions (removing numbering and whitespace)
	questionRegex := regexp.MustCompile(`^\s*\d+\.\s*(.+)$`)
	var questions []string

	for _, line := range relatedQuestionsLines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		questionMatches := questionRegex.FindStringSubmatch(line)
		if len(questionMatches) > 1 {
			// Remove any brackets that might be part of the template
			question := strings.Trim(questionMatches[1], "[]")
			question = strings.TrimSpace(question)
			if question != "" && question != "First related question" && 
			   question != "Second related question" && question != "Third related question" {
				questions = append(questions, question)
			}
		} else if !strings.HasPrefix(line, "RELATED_QUESTIONS") {
			// If it's not a numbered item but still looks like a question
			questions = append(questions, line)
		}
	}

	// Remove the related questions section from the content
	cleanedContent := relatedQuestionsRegex.ReplaceAllString(content, "")
	// Trim any trailing whitespace
	cleanedContent = strings.TrimSpace(cleanedContent)

	if len(questions) == 0 {
		return cleanedContent, nil
	}

	return cleanedContent, &chats.RelatedQuestions{Questions: questions}
}
