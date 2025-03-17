package db

import (
	"database/sql"
	"fmt"
	"log"
	"sync"

	_ "github.com/mattn/go-sqlite3" // SQLite driver
)

// DB is a wrapper around sql.DB
type DB struct {
	*sql.DB
}

var (
	instance *DB
	once     sync.Once
)

// Initialize sets up the database connection
func Initialize(dbPath string) (*DB, error) {
	var err error
	once.Do(func() {
		db, dbErr := sql.Open("sqlite3", dbPath)
		if dbErr != nil {
			err = fmt.Errorf("failed to open database: %w", dbErr)
			return
		}

		if dbErr = db.Ping(); dbErr != nil {
			err = fmt.Errorf("failed to ping database: %w", dbErr)
			return
		}

		instance = &DB{DB: db}
		err = setupTables(instance)
	})

	if err != nil {
		return nil, err
	}

	return instance, nil
}

// GetInstance returns the singleton DB instance
func GetInstance() *DB {
	if instance == nil {
		log.Fatal("Database not initialized. Call Initialize first.")
	}
	return instance
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.DB.Close()
}

// setupTables creates the necessary tables if they don't exist
func setupTables(db *DB) error {
	// Create settings table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`)
	if err != nil {
		return fmt.Errorf("failed to create settings table: %w", err)
	}

	// Create queries table to store history
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS queries (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			query TEXT NOT NULL,
			answer TEXT NOT NULL,
			sources TEXT,
			timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return fmt.Errorf("failed to create queries table: %w", err)
	}

	return nil
}

// SaveSetting saves a key-value setting to the database
func (db *DB) SaveSetting(key, value string) error {
	_, err := db.Exec(
		"INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
		key, value,
	)
	return err
}

// GetSetting retrieves a setting from the database
func (db *DB) GetSetting(key string) (string, error) {
	var value string
	err := db.QueryRow("SELECT value FROM settings WHERE key = ?", key).Scan(&value)
	return value, err
}

// SaveQuery saves a query and its response to the database
func (db *DB) SaveQuery(query, answer string, sources []string) error {
	// Convert sources slice to a string
	sourcesStr := fmt.Sprintf("%v", sources)

	_, err := db.Exec(
		"INSERT INTO queries (query, answer, sources) VALUES (?, ?, ?)",
		query, answer, sourcesStr,
	)
	return err
}

// GetRecentQueries retrieves recent queries from the database
func (db *DB) GetRecentQueries(limit int) ([]map[string]interface{}, error) {
	rows, err := db.Query(
		"SELECT id, query, answer, sources, timestamp FROM queries ORDER BY timestamp DESC LIMIT ?",
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var id int
		var query, answer, sources, timestamp string

		if err := rows.Scan(&id, &query, &answer, &sources, &timestamp); err != nil {
			return nil, err
		}

		results = append(results, map[string]interface{}{
			"id":        id,
			"query":     query,
			"answer":    answer,
			"sources":   sources,
			"timestamp": timestamp,
		})
	}

	return results, nil
}
