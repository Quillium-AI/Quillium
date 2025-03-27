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
			sso_auth_type VARCHAR(255) NOT NULL CHECK (sso_auth_type IN ('OAuth2', 'SAML', 'OIDC')),
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) NOT NULL UNIQUE,
			password_hash TEXT NULL,
			sso_user_id TEXT NULL,
			is_sso BOOLEAN NOT NULL DEFAULT FALSE,
			sso_provider_id INT NULL,
			is_admin BOOLEAN NOT NULL DEFAULT FALSE,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (sso_provider_id) REFERENCES sso_logins(id) ON DELETE CASCADE,
			CONSTRAINT chk_sso_provider_id CHECK (
				(is_sso = TRUE AND sso_provider_id IS NOT NULL) OR
				(is_sso = FALSE AND sso_provider_id IS NULL)
			),
			CONSTRAINT chk_sso_user_id CHECK (
				(is_sso = TRUE AND sso_user_id IS NOT NULL) OR
				(is_sso = FALSE)
			),
			CONSTRAINT chk_password_hash CHECK (
				(is_sso = FALSE AND password_hash IS NOT NULL) OR
				(is_sso = TRUE)
			)
		);
		CREATE INDEX IF NOT EXISTS idx_users_sso_provider_id ON users(sso_provider_id);
		CREATE TABLE IF NOT EXISTS chat_contents (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			content JSONB NOT NULL,
			is_public BOOLEAN NOT NULL DEFAULT FALSE,
			public_uuid VARCHAR(255) NULL UNIQUE,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_chat_contents_user_id ON chat_contents(user_id);
		CREATE UNIQUE INDEX idx_chat_contents_public_uuid ON chat_contents(public_uuid) WHERE public_uuid IS NOT NULL;
		CREATE INDEX idx_chat_contents_is_public ON chat_contents(is_public) WHERE is_public = TRUE;
		CREATE TABLE IF NOT EXISTS admin_settings (
			version SERIAL PRIMARY KEY,
			config JSONB NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS user_settings (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL UNIQUE,
			config JSONB NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
	`
	_, err := conn.Exec(context.Background(), query)
	if err != nil {
		return errors.New("failed to create tables: " + err.Error())
	}
	return nil
}
