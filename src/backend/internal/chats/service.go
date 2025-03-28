package chats

import "encoding/json"

// ToJSON converts the ChatContent to a JSON string for database storage
func (c *ChatContent) ToJSON() (string, error) {
	jsonStr, err := json.Marshal(c)
	if err != nil {
		return "", err
	}
	return string(jsonStr), nil
}

// FromJSON parses a JSON string into a ChatContent struct
func (c *ChatContent) FromJSON(jsonStr string) (*ChatContent, error) {
	var content ChatContent
	err := json.Unmarshal([]byte(jsonStr), &content)
	if err != nil {
		return nil, err
	}
	return &content, nil
}
