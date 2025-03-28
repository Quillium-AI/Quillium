package sso

import "encoding/json"

// ToJSON converts the struct to a JSON string
func (s *SsoProvider) ToJSON() (string, error) {
	bytes, err := json.Marshal(s)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// FromJSON parses a JSON string into the struct
func (s *SsoProvider) FromJSON(jsonStr string) error {
	return json.Unmarshal([]byte(jsonStr), s)
}
