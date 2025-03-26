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
			sso_client_id VARCHAR(255) NOT NULL UNIQUE,
			sso_client_secret VARCHAR(255) NOT NULL,
			sso_provider VARCHAR(255) NOT NULL UNIQUE,
			sso_redirect_url VARCHAR(255) NOT NULL,
			sso_type VARCHAR(255) NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) NOT NULL UNIQUE,
			password VARCHAR(255) NULL,
			sso_id VARCHAR(255) NULL,
			is_sso BOOLEAN NOT NULL DEFAULT FALSE,
			sso_provider_id INT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (sso_provider_id) REFERENCES sso_logins(id)
		);
		CREATE TABLE IF NOT EXISTS chat_contents (
			id SERIAL PRIMARY KEY,
			message JSONB NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS user_chats (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			chat_id INT NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (chat_id) REFERENCES chat_contents(id)
		);
		CREATE TABLE IF NOT EXISTS admin_settings (
			version SERIAL PRIMARY KEY,
			enable_signup BOOLEAN NOT NULL,
			is_admin INT NOT NULL,
			firecrawl_base_url VARCHAR(255) NOT NULL,
			firecrawl_api_key VARCHAR(255) NOT NULL,
			openai_base_url VARCHAR(255) NOT NULL,
			openai_api_key VARCHAR(255) NOT NULL,
			llm_profile_speed VARCHAR(255) NOT NULL,
			llm_profile_balanced VARCHAR(255) NOT NULL,
			llm_profile_quality VARCHAR(255) NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (is_admin) REFERENCES users(id)
		);
		CREATE TABLE IF NOT EXISTS user_settings (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			dark_mode BOOLEAN NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		);
	`
	_, err := conn.Exec(context.Background(), query)
	if err != nil {
		return errors.New("failed to create tables: " + err.Error())
	}
	return nil
}
