package settings

import "encoding/json"

func (s *UserSettings) ToJSON() (string, error) {
	jsonStr, err := json.Marshal(s)
	if err != nil {
		return "", err
	}
	return string(jsonStr), nil
}

func (s *UserSettings) FromJSON(jsonStr string) (*UserSettings, error) {
	var settings UserSettings
	err := json.Unmarshal([]byte(jsonStr), &settings)
	if err != nil {
		return nil, err
	}
	return &settings, nil
}

func (s *AdminSettings) ToJSON() (string, error) {
	jsonStr, err := json.Marshal(s)
	if err != nil {
		return "", err
	}
	return string(jsonStr), nil
}

func (s *AdminSettings) FromJSON(jsonStr string) (*AdminSettings, error) {
	var settings AdminSettings
	err := json.Unmarshal([]byte(jsonStr), &settings)
	if err != nil {
		return nil, err
	}
	return &settings, nil
}
