package main

import (
	"fmt"
	"time"

	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
)

var dbConn *db.DB

func init() {
	var err error
	time.Sleep(10 * time.Second)
	dbConn, err = db.Initialize()
	if err != nil {
		panic(err)
	}
}

func main() {
	fmt.Println("Hello, World!")
	defer dbConn.Close()
	// Rest of your application code
}
