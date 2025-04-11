package chats

import "encoding/json"

// ToJSON converts the ChatContent to a JSON string for database storage
// Only serializes Title and Messages (without Sources) to prevent duplicate storage
func (c *ChatContent) ToJSON() (string, error) {
	// Create a ChatContentWithoutSources to avoid storing sources twice
	contentWithoutSources := ChatContentWithoutSources{
		Title:    c.Title,
		Messages: c.Messages,
	}
	
	jsonStr, err := json.Marshal(contentWithoutSources)
	if err != nil {
		return "", err
	}
	return string(jsonStr), nil
}

// FromJSON parses a JSON string into a ChatContent struct
// The JSON string only contains Title and Messages (without Sources)
func (c *ChatContent) FromJSON(jsonStr string) (*ChatContent, error) {
	var contentWithoutSources ChatContentWithoutSources
	err := json.Unmarshal([]byte(jsonStr), &contentWithoutSources)
	if err != nil {
		return nil, err
	}
	
	// Create a new ChatContent with the parsed data
	content := &ChatContent{
		Title:    contentWithoutSources.Title,
		Messages: contentWithoutSources.Messages,
		// Sources will be loaded separately from the database
		Sources:  []Source{},
	}
	
	return content, nil
}
