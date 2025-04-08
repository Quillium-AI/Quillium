package initialization

import (
	"log"
	"os"

	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
	"github.com/Quillium-AI/Quillium/src/backend/internal/settings"
)

// InitializeAdminSettings initializes or updates admin settings with environment variables
func InitializeAdminSettings(dbConn *db.DB) error {
	log.Println("Checking admin settings...")

	// Get existing admin settings from database
	adminSettings, err := dbConn.GetAdminSettings()
	var settingsUpdated bool

	// If no settings exist or there was an error, create default settings
	if err != nil {
		log.Println("No admin settings found. Creating default settings...")
		
		// Create default settings
		adminSettings = &settings.AdminSettings{
			FirecrawlBaseURL:   "https://api.firecrawl.dev",
			OpenAIBaseURL:      "https://api.openai.com",
			LLMProfileSpeed:    "gpt-3.5-turbo",
			LLMProfileBalanced: "gpt-4o",
			LLMProfileQuality:  "gpt-4o",
			EnableSignUps:      true,
		}
		settingsUpdated = true
	}

	// Check for environment variables and update settings if they exist
	// Firecrawl API Key
	firecrawlAPIKey := os.Getenv("FIRECRAWL_API_KEY")
	if firecrawlAPIKey != "" {
		encryptedKey, err := security.EncryptPassword(firecrawlAPIKey)
		if err != nil {
			log.Printf("Warning: Failed to encrypt Firecrawl API key: %v", err)
		} else if encryptedKey != nil {
			adminSettings.FirecrawlAPIKey_encrypt = *encryptedKey // Dereference the pointer
			settingsUpdated = true
			log.Println("Updated Firecrawl API key from environment variable")
		}
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
			log.Println("Updated OpenAI API key from environment variable")
		}
	}

	// Firecrawl Base URL
	firecrawlBaseURL := os.Getenv("FIRECRAWL_BASE_URL")
	if firecrawlBaseURL != "" {
		adminSettings.FirecrawlBaseURL = firecrawlBaseURL
		settingsUpdated = true
		log.Println("Updated Firecrawl base URL from environment variable")
	}

	// OpenAI Base URL
	openAIBaseURL := os.Getenv("OPENAI_BASE_URL")
	if openAIBaseURL != "" {
		adminSettings.OpenAIBaseURL = openAIBaseURL
		settingsUpdated = true
		log.Println("Updated OpenAI base URL from environment variable")
	}

	// LLM Profile Models
	// Speed profile model
	llmProfileSpeed := os.Getenv("LLM_PROFILE_SPEED")
	if llmProfileSpeed != "" {
		adminSettings.LLMProfileSpeed = llmProfileSpeed
		settingsUpdated = true
		log.Println("Updated LLM speed profile model from environment variable")
	}

	// Balanced profile model
	llmProfileBalanced := os.Getenv("LLM_PROFILE_BALANCED")
	if llmProfileBalanced != "" {
		adminSettings.LLMProfileBalanced = llmProfileBalanced
		settingsUpdated = true
		log.Println("Updated LLM balanced profile model from environment variable")
	}

	// Quality profile model
	llmProfileQuality := os.Getenv("LLM_PROFILE_QUALITY")
	if llmProfileQuality != "" {
		adminSettings.LLMProfileQuality = llmProfileQuality
		settingsUpdated = true
		log.Println("Updated LLM quality profile model from environment variable")
	}

	// Enable Signups setting
	enableSignUps := os.Getenv("ENABLE_SIGNUPS")
	if enableSignUps != "" {
		// Convert string to bool (treat "true" or "1" as true)
		enableSignUpsBool := enableSignUps == "true" || enableSignUps == "1"
		adminSettings.EnableSignUps = enableSignUpsBool
		settingsUpdated = true
		log.Println("Updated enable signups setting from environment variable")
	}

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
