package main

import (
	"log"
	"os"
	"time"

	"github.com/Quillium-AI/Quillium/src/backend/internal/api"
	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
	"github.com/Quillium-AI/Quillium/src/backend/internal/user"
)

var dbConn *db.DB

func init() {
	var err error
	time.Sleep(15 * time.Second)
	dbConn, err = db.Initialize()
	if err != nil {
		log.Fatal("Failed to initialize database connection:", err)
	}

	// Initialize encryption
	err = security.InitEncryption([]byte(os.Getenv("ENCRYPTION_KEY")))
	if err != nil {
		log.Fatal("Failed to initialize encryption:", err)
	}

	// Check if admin user already exists
	adminExists, err := dbConn.AdminExists()
	if err != nil {
		log.Fatal("Error checking if admin exists:", err)
	}

	// Only create admin if one doesn't exist
	if !adminExists {
		log.Println("No admin user found. Creating admin user...")
		email := os.Getenv("ADMIN_EMAIL")
		passwordHash, err := security.HashPassword(os.Getenv("ADMIN_PASSWORD"))

		// Check if we have admin credentials
		if email == "" || passwordHash == nil || err != nil {
			log.Fatal("Error: ADMIN_EMAIL or ADMIN_PASSWORD environment variables not set")
		} else {
			// Create admin user
			adminUser := &user.User{
				Email:        email,
				PasswordHash: passwordHash,
				IsSso:        false,
				IsAdmin:      true,
			}
			_, err = dbConn.CreateUser(adminUser)
			if err != nil {
				log.Fatal("Failed to create admin user:", err)
			}
			log.Println("Admin user created successfully")
		}
	} else {
		log.Println("Admin user already exists. Skipping creation.")
	}
}

func main() {
	log.Println("Starting backend...")
	defer dbConn.Close()

	// Get JWT secret from environment or use a default for development
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) == 0 {
		log.Println("Warning: Using default JWT secret. Set JWT_SECRET environment variable in production.")
		jwtSecret = []byte("quillium-dev-secret-key")
	}

	// Create and start the API server
	server := api.NewServer(":8080", dbConn, jwtSecret)
	log.Fatal(server.Start())
}
