package db

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/dgraph-io/badger/v3"
)

// DB is a wrapper around badger.DB
type DB struct {
	*badger.DB
}

var (
	instance *DB
	once     sync.Once
)

// Initialize sets up the database connection
func Initialize(dbPath string) (*DB, error) {
	var err error
	once.Do(func() {
		opts := badger.DefaultOptions(dbPath)
		opts.Logger = nil // Disable logging

		db, dbErr := badger.Open(opts)
		if dbErr != nil {
			err = fmt.Errorf("failed to open database: %w", dbErr)
			return
		}

		instance = &DB{DB: db}
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

// SaveSetting saves a key-value setting to the database
func (db *DB) SaveSetting(key, value string) error {
	return db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("setting:"+key), []byte(value))
	})
}

// GetSetting retrieves a setting from the database
func (db *DB) GetSetting(key string) (string, error) {
	var value string
	err := db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte("setting:" + key))
		if err != nil {
			return err
		}

		return item.Value(func(val []byte) error {
			value = string(val)
			return nil
		})
	})

	if err == badger.ErrKeyNotFound {
		return "", nil
	}

	return value, err
}

// QueryRecord represents a stored query
type QueryRecord struct {
	ID        string    `json:"id"`
	Query     string    `json:"query"`
	Answer    string    `json:"answer"`
	Sources   []string  `json:"sources,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// SaveQuery saves a query and its response to the database
func (db *DB) SaveQuery(query, answer string, sources []string) error {
	record := QueryRecord{
		ID:        fmt.Sprintf("query:%d", time.Now().UnixNano()),
		Query:     query,
		Answer:    answer,
		Sources:   sources,
		Timestamp: time.Now(),
	}

	data, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte(record.ID), data)
	})
}

// GetRecentQueries retrieves recent queries from the database
func (db *DB) GetRecentQueries(limit int) ([]map[string]interface{}, error) {
	result := []map[string]interface{}{}

	err := db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchSize = limit
		opts.Reverse = true // To get the most recent first

		it := txn.NewIterator(opts)
		defer it.Close()

		prefix := []byte("query:")
		count := 0

		for it.Seek(append(prefix, 0xFF)); it.ValidForPrefix(prefix) && count < limit; it.Next() {
			item := it.Item()

			err := item.Value(func(val []byte) error {
				var record QueryRecord
				if err := json.Unmarshal(val, &record); err != nil {
					return err
				}

				result = append(result, map[string]interface{}{
					"id":        record.ID,
					"query":     record.Query,
					"answer":    record.Answer,
					"sources":   record.Sources,
					"timestamp": record.Timestamp,
				})

				count++
				return nil
			})

			if err != nil {
				return err
			}
		}

		return nil
	})

	return result, err
}
