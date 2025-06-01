package settings

type UserSettings struct {
	IsDarkMode bool `json:"is_dark_mode"`
}

type AdminSettings struct {
	OpenAIBaseURL         string   `json:"openai_base_url"`
	OpenAIAPIKey_encrypt  string   `json:"openai_api_key_encrypt"`
	LLMProfileSpeed       string   `json:"llm_profile_speed"`
	LLMProfileBalanced    string   `json:"llm_profile_balanced"`
	LLMProfileQuality     string   `json:"llm_profile_quality"`
	EnableSignUps         bool     `json:"enable_sign_ups"`
	WebcrawlerURL         string   `json:"webcrawler_url"`
	ElasticsearchURL      string   `json:"elasticsearch_url"`
	ElasticsearchUsername string   `json:"elasticsearch_username"`
	ElasticsearchPassword string   `json:"elasticsearch_password"`
	EnvOverrides          []string `json:"env_overrides"`
}
