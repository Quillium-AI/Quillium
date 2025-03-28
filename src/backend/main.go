package main

import (
	"log"
	"os"
	"time"

	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
)

var dbConn *db.DB

func init() {
	var err error
	time.Sleep(10 * time.Second)
	dbConn, err = db.Initialize()
	if err != nil {
		log.Fatal("Failed to initialize database connection:", err)
	}

	// Check if admin user already exists
	adminExists, err := dbConn.AdminExists()
	if err != nil {
		log.Fatal("Error checking if admin exists:", err)
	}

	// Only create admin if one doesn't exist
	if !adminExists {
		log.Println("No admin user found. Creating admin user...")
		email, passwordHash := os.Getenv("ADMIN_EMAIL"), os.Getenv("ADMIN_PASSWORD")

		// Check if we have admin credentials
		if email == "" || passwordHash == "" {
			log.Fatal("Warning: ADMIN_EMAIL or ADMIN_PASSWORD environment variables not set")
		} else {
			// Create admin user
			err = dbConn.CreateUser(email, passwordHash, false, nil, true)
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
	log.Println("Backend started")
	defer dbConn.Close()
}
