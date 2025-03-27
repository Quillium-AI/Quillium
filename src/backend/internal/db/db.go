package db

import (
	"context"
	"errors"
	"os"

	"github.com/jackc/pgx/v5"
)

type DB struct {
	*pgx.Conn
}

func (d *DB) Close() error {
	return d.Conn.Close(context.Background())
}

func (d *DB) Ping() error {
	return d.Conn.Ping(context.Background())
}

func Initialize() (*DB, error) {
	pgxConn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, errors.New("failed to connect to database: " + err.Error())
	}

	err = CreateTables(pgxConn)
	if err != nil {
		return nil, errors.New("failed to create tables: " + err.Error())
	}

	return &DB{Conn: pgxConn}, nil
}

func CreateTables(conn *pgx.Conn) error {
	query := `
		CREATE TABLE IF NOT EXISTS sso_logins (
			id SERIAL PRIMARY KEY,
			sso_client_id VARCHAR(255) NOT NULL,
			sso_client_secret VARCHAR(255) NOT NULL,
			sso_provider VARCHAR(255) NOT NULL UNIQUE,
			sso_redirect_url VARCHAR(255) NOT NULL,
			sso_type VARCHAR(255) NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) NOT NULL UNIQUE,
			password_hash TEXT NULL,
			sso_user_id TEXT NULL,
			is_sso BOOLEAN NOT NULL DEFAULT FALSE,
			sso_provider_id INT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (sso_provider_id) REFERENCES sso_logins(id)
		);
		CREATE TABLE IF NOT EXISTS chat_contents (
			id SERIAL PRIMARY KEY,
			content JSONB NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS user_chats (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			chat_id INT NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (chat_id) REFERENCES chat_contents(id) ON DELETE CASCADE
		);
		
		-- Create a function to delete orphaned chat contents
		CREATE OR REPLACE FUNCTION delete_orphaned_chat_contents()
		RETURNS TRIGGER AS $$
		BEGIN
			-- Delete chat_contents that are no longer referenced by any user
			DELETE FROM chat_contents
			WHERE id = OLD.chat_id
			AND NOT EXISTS (SELECT 1 FROM user_chats WHERE chat_id = OLD.chat_id);
			RETURN OLD;
		END;
		$$ LANGUAGE plpgsql;
		
		-- Create a trigger to run after a user_chats row is deleted
		DROP TRIGGER IF EXISTS trigger_delete_orphaned_chat_contents ON user_chats;
		CREATE TRIGGER trigger_delete_orphaned_chat_contents
		AFTER DELETE ON user_chats
		FOR EACH ROW
		EXECUTE FUNCTION delete_orphaned_chat_contents();
		
		CREATE TABLE IF NOT EXISTS admin_settings (
			version SERIAL PRIMARY KEY,
			enable_signup BOOLEAN NOT NULL,
			is_admin INT NULL,
			firecrawl_base_url VARCHAR(255) NOT NULL,
			firecrawl_api_key_encrypt TEXT NOT NULL,
			openai_base_url VARCHAR(255) NOT NULL,
			openai_api_key_encrypt TEXT NOT NULL,
			llm_profile_speed VARCHAR(255) NOT NULL,
			llm_profile_balanced VARCHAR(255) NOT NULL,
			llm_profile_quality VARCHAR(255) NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (is_admin) REFERENCES users(id) ON DELETE SET NULL
		);
		CREATE TABLE IF NOT EXISTS user_settings (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			dark_mode BOOLEAN NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);
	`
	_, err := conn.Exec(context.Background(), query)
	if err != nil {
		return errors.New("failed to create tables: " + err.Error())
	}
	return nil
}
