package config

import (
	"os"
	"sync"
)

// Config holds all configuration for the application
type Config struct {
	// Server configuration
	Port string `json:"port"`

	// AI service configuration
	AIEndpoint string `json:"ai_endpoint"`
	APIKey     string `json:"api_key"`

	// Database configuration
	DBPath string `json:"db_path"`
}

var (
	config Config
	once   sync.Once
)

// Get returns the singleton config instance
func Get() *Config {
	once.Do(func() {
		// Default values
		config = Config{
			Port:       getEnv("PORT", "8080"),
			AIEndpoint: getEnv("AI_ENDPOINT", "https://api.openai.com/v1"),
			APIKey:     getEnv("API_KEY", ""),
			DBPath:     getEnv("DB_PATH", "./data.db"),
		}
	})

	return &config
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
