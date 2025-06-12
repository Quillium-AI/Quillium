package initialization

import (
	"log"
	"os"

	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/db"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/security"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/settings"
)

// InitializeAdminSettings initializes or updates admin settings with environment variables
func InitializeAdminSettings(dbConn *db.DB) error {
	log.Println("Checking admin settings...")

	// Get existing admin settings from database
	adminSettings, err := dbConn.GetAdminSettings()
	var settingsUpdated bool
	var envOverrides []string

	// If no settings exist or there was an error, create default settings
	if err != nil {
		log.Println("No admin settings found. Creating default settings...")

		// Create default settings
		adminSettings = &settings.AdminSettings{
			OpenAIBaseURL:         "https://api.openai.com",
			LLMProfileSpeed:       "gpt-3.5-turbo",
			LLMProfileBalanced:    "gpt-4o",
			LLMProfileQuality:     "gpt-4o",
			EnableSignUps:         true,
			WebcrawlerURL:         "",
			ElasticsearchURL:      "",
			ElasticsearchUsername: "",
			ElasticsearchPassword: "",
			EnvOverrides:          []string{},
		}
		settingsUpdated = true
	}

	// OpenAI API Key
	openAIAPIKey := os.Getenv("OPENAI_API_KEY")
	if openAIAPIKey != "" {
		encryptedKey, err := security.EncryptPassword(openAIAPIKey)
		if err != nil {
			log.Printf("Warning: Failed to encrypt OpenAI API key: %v", err)
		} else if encryptedKey != nil {
			adminSettings.OpenAIAPIKey_encrypt = *encryptedKey // Dereference the pointer
			settingsUpdated = true
			envOverrides = append(envOverrides, "OPENAI_API_KEY")
			log.Println("Updated OpenAI API key from environment variable")
		}
	}

	// OpenAI Base URL
	openAIBaseURL := os.Getenv("OPENAI_BASE_URL")
	if openAIBaseURL != "" {
		adminSettings.OpenAIBaseURL = openAIBaseURL
		settingsUpdated = true
		envOverrides = append(envOverrides, "OPENAI_BASE_URL")
		log.Println("Updated OpenAI base URL from environment variable")
	}

	// LLM Profile Models
	// Speed profile model
	llmProfileSpeed := os.Getenv("LLM_PROFILE_SPEED")
	if llmProfileSpeed != "" {
		adminSettings.LLMProfileSpeed = llmProfileSpeed
		settingsUpdated = true
		envOverrides = append(envOverrides, "LLM_PROFILE_SPEED")
		log.Println("Updated LLM speed profile model from environment variable")
	}

	// Balanced profile model
	llmProfileBalanced := os.Getenv("LLM_PROFILE_BALANCED")
	if llmProfileBalanced != "" {
		adminSettings.LLMProfileBalanced = llmProfileBalanced
		settingsUpdated = true
		envOverrides = append(envOverrides, "LLM_PROFILE_BALANCED")
		log.Println("Updated LLM balanced profile model from environment variable")
	}

	// Quality profile model
	llmProfileQuality := os.Getenv("LLM_PROFILE_QUALITY")
	if llmProfileQuality != "" {
		adminSettings.LLMProfileQuality = llmProfileQuality
		settingsUpdated = true
		envOverrides = append(envOverrides, "LLM_PROFILE_QUALITY")
		log.Println("Updated LLM quality profile model from environment variable")
	}

	// Enable Signups setting
	enableSignUps := os.Getenv("ENABLE_SIGNUPS")
	if enableSignUps != "" {
		// Convert string to bool (treat "true" or "1" as true)
		enableSignUpsBool := enableSignUps == "true" || enableSignUps == "1"
		adminSettings.EnableSignUps = enableSignUpsBool
		settingsUpdated = true
		envOverrides = append(envOverrides, "ENABLE_SIGNUPS")
		log.Println("Updated enable signups setting from environment variable")
	}

	// Webcrawler URL
	webcrawlerURL := os.Getenv("WEBCRAWLER_URL")
	if webcrawlerURL != "" {
		adminSettings.WebcrawlerURL = webcrawlerURL
		settingsUpdated = true
		envOverrides = append(envOverrides, "WEBCRAWLER_URL")
		log.Println("Updated Webcrawler URL from environment variable")
	}

	// Elasticsearch URL
	elasticsearchURL := os.Getenv("ELASTICSEARCH_URL")
	if elasticsearchURL != "" {
		adminSettings.ElasticsearchURL = elasticsearchURL
		settingsUpdated = true
		envOverrides = append(envOverrides, "ELASTICSEARCH_URL")
		log.Println("Updated Elasticsearch URL from environment variable")
	}

	// Elasticsearch Username
	elasticsearchUsername := os.Getenv("ELASTICSEARCH_USERNAME")
	if elasticsearchUsername != "" {
		adminSettings.ElasticsearchUsername = elasticsearchUsername
		settingsUpdated = true
		envOverrides = append(envOverrides, "ELASTICSEARCH_USERNAME")
		log.Println("Updated Elasticsearch username from environment variable")
	}

	// Elasticsearch Password
	elasticsearchPassword := os.Getenv("ELASTICSEARCH_PASSWORD")
	if elasticsearchPassword != "" {
		adminSettings.ElasticsearchPassword = elasticsearchPassword
		settingsUpdated = true
		envOverrides = append(envOverrides, "ELASTICSEARCH_PASSWORD")
		log.Println("Updated Elasticsearch password from environment variable")
	}

	// Set environment overrides
	adminSettings.EnvOverrides = envOverrides

	// Save settings if they were updated
	if settingsUpdated {
		if err := dbConn.CreateAdminSettings(adminSettings); err != nil {
			log.Printf("Warning: Failed to save admin settings: %v", err)
			return err
		} else {
			log.Println("Admin settings saved successfully")
		}
	} else {
		log.Println("No changes to admin settings")
	}

	return nil
}
