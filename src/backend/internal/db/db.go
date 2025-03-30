package db

import (
	"context"
	"errors"
	"log"
	"os"

	"github.com/Quillium-AI/Quillium/src/backend/internal/chats"
	"github.com/Quillium-AI/Quillium/src/backend/internal/settings"
	"github.com/Quillium-AI/Quillium/src/backend/internal/sso"
	"github.com/Quillium-AI/Quillium/src/backend/internal/user"
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
		CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_contents_public_uuid ON chat_contents(public_uuid) WHERE public_uuid IS NOT NULL;
		CREATE INDEX IF NOT EXISTS idx_chat_contents_is_public ON chat_contents(is_public) WHERE is_public = TRUE;
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
		CREATE TABLE IF NOT EXISTS user_apikeys (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			api_key_encrypt TEXT NOT NULL UNIQUE,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_user_apikeys_user_id ON user_apikeys(user_id);
	`
	_, err := conn.Exec(context.Background(), query)
	if err != nil {
		return errors.New("failed to create tables: " + err.Error())
	}
	return nil
}

func (d *DB) CreateUser(user *user.User) (*int, error) {
	query := `
		INSERT INTO users (email, password_hash, is_sso, sso_provider_id, is_admin)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`
	querySettings := `
		INSERT INTO user_settings (user_id, config)
		VALUES ($1, '{}')
	`
	var id int
	err := d.Conn.QueryRow(context.Background(), query, user.Email, user.PasswordHash, user.IsSso, user.SsoProviderID, user.IsAdmin).Scan(&id)
	if err != nil {
		return nil, errors.New("failed to create user: " + err.Error())
	}
	_, err = d.Conn.Exec(context.Background(), querySettings, id)
	if err != nil {
		return nil, errors.New("failed to create user settings: " + err.Error())
	}
	log.Printf("Created user with ID: %d", id)
	return &id, nil
}

func (d *DB) CreateSsoProvider(ssoProvider *sso.SsoProvider) error {
	query := `
		INSERT INTO sso_logins (sso_client_id, sso_client_secret, sso_provider, sso_redirect_url, sso_auth_type)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`
	var id int
	err := d.Conn.QueryRow(context.Background(), query, ssoProvider.ClientID, ssoProvider.ClientSecret, ssoProvider.Provider, ssoProvider.RedirectURL, ssoProvider.AuthType).Scan(&id)
	if err != nil {
		return errors.New("failed to create sso provider: " + err.Error())
	}
	log.Printf("Created sso provider with ID: %d", id)
	return nil
}

func (d *DB) CreateChat(userId int, chatContent *chats.ChatContent) error {
	jsonStr, err := chatContent.ToJSON()
	if err != nil {
		return errors.New("failed to convert chat content to JSON: " + err.Error())
	}

	query := `
		INSERT INTO chat_contents (user_id, content)
		VALUES ($1, $2)
		RETURNING id
	`
	var id int
	err = d.Conn.QueryRow(context.Background(), query, userId, jsonStr).Scan(&id)
	if err != nil {
		return errors.New("failed to create chat: " + err.Error())
	}
	log.Printf("Created chat with ID: %d", id)
	return nil
}

func (d *DB) GetChats(userId int) ([]int, error) {
	query := `
		SELECT id FROM chat_contents WHERE user_id = $1
	`
	rows, err := d.Conn.Query(context.Background(), query, userId)
	if err != nil {
		return nil, errors.New("failed to get chats: " + err.Error())
	}
	defer rows.Close()

	var ids []int
	for rows.Next() {
		var id int
		err = rows.Scan(&id)
		if err != nil {
			return nil, errors.New("failed to get chats: " + err.Error())
		}
		ids = append(ids, id)
	}

	return ids, nil
}

func (d *DB) GetChatContent(chatId int) (*chats.ChatContent, error) {
	query := `
		SELECT content FROM chat_contents WHERE id = $1
	`
	var jsonStr string
	err := d.Conn.QueryRow(context.Background(), query, chatId).Scan(&jsonStr)
	if err != nil {
		return nil, errors.New("failed to get chat content: " + err.Error())
	}

	// Create an empty ChatContent instance to call the method on
	var empty chats.ChatContent
	chatContent, err := empty.FromJSON(jsonStr)
	if err != nil {
		return nil, errors.New("failed to parse chat content: " + err.Error())
	}
	return chatContent, nil
}

func (d *DB) DeleteChat(chatId int) error {
	query := `
		DELETE FROM chat_contents WHERE id = $1
	`
	_, err := d.Conn.Exec(context.Background(), query, chatId)
	if err != nil {
		return errors.New("failed to delete chat: " + err.Error())
	}
	log.Printf("Deleted chat with ID: %d", chatId)
	return nil
}

func (d *DB) DeleteUser(userId int) error {
	query := `
		DELETE FROM users WHERE id = $1
	`
	_, err := d.Conn.Exec(context.Background(), query, userId)
	if err != nil {
		return errors.New("failed to delete user: " + err.Error())
	}
	log.Printf("Deleted user with ID: %d", userId)
	return nil
}

func (d *DB) DeleteSsoProvider(ssoProviderId int) error {
	query := `
		DELETE FROM sso_logins WHERE id = $1
	`
	_, err := d.Conn.Exec(context.Background(), query, ssoProviderId)
	if err != nil {
		return errors.New("failed to delete sso provider: " + err.Error())
	}
	log.Printf("Deleted sso provider with ID: %d", ssoProviderId)
	return nil
}

func (d *DB) UpdateUserSettings(userId int, config *settings.UserSettings) error {
	query := `
		UPDATE user_settings
		SET config = $1
		WHERE user_id = $2
	`
	_, err := d.Conn.Exec(context.Background(), query, config, userId)
	if err != nil {
		return errors.New("failed to update user settings: " + err.Error())
	}
	log.Printf("Updated user settings for user with ID: %d", userId)
	return nil
}

func (d *DB) GetUserSettings(userId int) (*settings.UserSettings, error) {
	query := `
		SELECT config FROM user_settings WHERE user_id = $1
	`
	var config settings.UserSettings
	err := d.Conn.QueryRow(context.Background(), query, userId).Scan(&config)
	if err != nil {
		return nil, errors.New("failed to get user settings: " + err.Error())
	}
	return &config, nil
}

func (d *DB) UpdateAdminSettings(config *settings.AdminSettings) error {
	query := `
		UPDATE admin_settings
		SET config = $1
		WHERE version = (SELECT MAX(version) FROM admin_settings)
	`
	_, err := d.Conn.Exec(context.Background(), query, config)
	if err != nil {
		return errors.New("failed to update admin settings: " + err.Error())
	}
	log.Printf("Updated admin settings")
	return nil
}

func (d *DB) GetAdminSettings() (*settings.AdminSettings, error) {
	query := `
		SELECT config FROM admin_settings
		WHERE version = (SELECT MAX(version) FROM admin_settings)
	`
	var config settings.AdminSettings
	err := d.Conn.QueryRow(context.Background(), query).Scan(&config)
	if err != nil {
		return nil, errors.New("failed to get admin settings: " + err.Error())
	}
	return &config, nil
}

func (d *DB) UpdateChatContent(chatId int, chatContent *chats.ChatContent) error {
	jsonStr, err := chatContent.ToJSON()
	if err != nil {
		return errors.New("failed to convert chat content to JSON: " + err.Error())
	}
	query := `
		UPDATE chat_contents
		SET content = $1
		WHERE id = $2
	`
	_, err = d.Conn.Exec(context.Background(), query, jsonStr, chatId)
	if err != nil {
		return errors.New("failed to update chat content: " + err.Error())
	}
	log.Printf("Updated chat content for chat with ID: %d", chatId)
	return nil
}

func (d *DB) UpdateUserPassword(userId int, passwordHash string) error {
	query := `
		UPDATE users
		SET password_hash = $1
		WHERE id = $2
	`
	_, err := d.Conn.Exec(context.Background(), query, passwordHash, userId)
	if err != nil {
		return errors.New("failed to update user password: " + err.Error())
	}
	log.Printf("Updated user password for user with ID: %d", userId)
	return nil
}

func (d *DB) UpdateUserEmail(userId int, email string) error {
	query := `
		UPDATE users
		SET email = $1
		WHERE id = $2
	`
	_, err := d.Conn.Exec(context.Background(), query, email, userId)
	if err != nil {
		return errors.New("failed to update user email: " + err.Error())
	}
	log.Printf("Updated user email for user with ID: %d", userId)
	return nil
}

func (d *DB) AdminExists() (bool, error) {
	query := `
		SELECT EXISTS(SELECT 1 FROM users WHERE is_admin = TRUE LIMIT 1)
	`
	var exists bool
	err := d.Conn.QueryRow(context.Background(), query).Scan(&exists)
	if err != nil {
		return false, errors.New("failed to check if admin exists: " + err.Error())
	}
	return exists, nil
}

func (d *DB) UpdateUserIsAdmin(userId int, isAdmin bool) error {
	query := `
		UPDATE users
		SET is_admin = $1
		WHERE id = $2
	`
	_, err := d.Conn.Exec(context.Background(), query, isAdmin, userId)
	if err != nil {
		return errors.New("failed to update user is_admin: " + err.Error())
	}
	log.Printf("Updated user is_admin for user with ID: %d", userId)
	return nil
}

func (d *DB) CreateAdminSettings(config *settings.AdminSettings) error {
	// First create the admin settings with empty config
	query := `
		INSERT INTO admin_settings (config)
		VALUES ($1)
		RETURNING version
	`
	var version int
	err := d.Conn.QueryRow(context.Background(), query, config).Scan(&version)
	if err != nil {
		return errors.New("failed to initialize admin settings: " + err.Error())
	}

	log.Printf("Created admin settings with version: %d", version)
	return nil
}

func (d *DB) CreateSsoUser(email string, ssoUserId string, ssoProviderId int) (*int, error) {
	// Create a User object with SSO information
	user := &user.User{
		Email:         email,
		PasswordHash:  nil,
		IsSso:         true,
		SsoUserID:     &ssoUserId,
		SsoProviderID: &ssoProviderId,
		IsAdmin:       false,
	}
	id, err := d.CreateUser(user)
	if err != nil {
		return nil, errors.New("failed to create sso user: " + err.Error())
	}
	return id, nil
}

func (d *DB) GetUser(email *string, id *int) (*user.User, error) {
	// Check if at least one parameter is provided
	if email == nil && id == nil {
		return nil, errors.New("at least one of email or id must be provided")
	}

	var query string
	var args []interface{}

	// Build query based on which parameters are provided
	switch {
	case email != nil && id != nil:
		// Both email and id are provided
		query = `
			SELECT id, email, password_hash, is_sso, sso_user_id, sso_provider_id, is_admin
			FROM users
			WHERE email = $1 OR id = $2
		`
		args = []interface{}{email, *id}
	case email != nil:
		// Only email is provided
		query = `
			SELECT id, email, password_hash, is_sso, sso_user_id, sso_provider_id, is_admin
			FROM users
			WHERE email = $1
		`
		args = []interface{}{email}
	case id != nil:
		// Only id is provided
		query = `
			SELECT id, email, password_hash, is_sso, sso_user_id, sso_provider_id, is_admin
			FROM users
			WHERE id = $1
		`
		args = []interface{}{*id}
	}

	var u user.User
	err := d.Conn.QueryRow(context.Background(), query, args...).Scan(
		&u.ID,
		&u.Email,
		&u.PasswordHash,
		&u.IsSso,
		&u.SsoUserID,
		&u.SsoProviderID,
		&u.IsAdmin,
	)
	if err != nil {
		return nil, errors.New("failed to get user: " + err.Error())
	}
	return &u, nil
}

func (d *DB) GetUsers() ([]*user.User, error) {
	query := `
		SELECT id, email, password_hash, is_sso, sso_user_id, sso_provider_id, is_admin
		FROM users
	`
	rows, err := d.Conn.Query(context.Background(), query)
	if err != nil {
		return nil, errors.New("failed to get users: " + err.Error())
	}
	defer rows.Close()

	var users []*user.User
	for rows.Next() {
		u := &user.User{}
		err := rows.Scan(
			&u.ID,
			&u.Email,
			&u.PasswordHash,
			&u.IsSso,
			&u.SsoUserID,
			&u.SsoProviderID,
			&u.IsAdmin,
		)
		if err != nil {
			return nil, errors.New("failed to scan user: " + err.Error())
		}
		users = append(users, u)
	}
	return users, nil
}

func (d *DB) CreateUserApikey(user *user.User, apikey string) error {
	query := `
		INSERT INTO user_apikeys (user_id, api_key_encrypt)
		VALUES ($1, $2)
	`
	_, err := d.Conn.Exec(context.Background(), query, user.ID, apikey)
	if err != nil {
		return errors.New("failed to create user apikey: " + err.Error())
	}
	return nil
}

func (d *DB) GetUserByApikey(apikey_encrypt string) (int, error) {
	query := `
		SELECT user_id
		FROM user_apikeys
		WHERE api_key_encrypt = $1
	`
	var apikey int
	err := d.Conn.QueryRow(context.Background(), query, apikey_encrypt).Scan(&apikey)
	if err != nil {
		return -1, errors.New("failed to get user apikey: " + err.Error())
	}
	return apikey, nil
}

func (d *DB) GetUserApikeys(user *user.User) ([]string, error) {
	query := `
		SELECT api_key_encrypt
		FROM user_apikeys
		WHERE user_id = $1
	`
	var apikeys []string
	rows, err := d.Conn.Query(context.Background(), query, user.ID)
	if err != nil {
		return nil, errors.New("failed to get user apikeys: " + err.Error())
	}
	defer rows.Close()

	for rows.Next() {
		var apikey string
		err := rows.Scan(&apikey)
		if err != nil {
			return nil, errors.New("failed to scan user apikey: " + err.Error())
		}
		apikeys = append(apikeys, apikey)
	}
	return apikeys, nil
}

func (d *DB) DeleteUserApikey(user *user.User, apikey_encrypt string) error {
	query := `
		DELETE FROM user_apikeys
		WHERE user_id = $1 AND api_key_encrypt = $2
	`
	_, err := d.Conn.Exec(context.Background(), query, user.ID, apikey_encrypt)
	if err != nil {
		return errors.New("failed to delete user apikey: " + err.Error())
	}
	return nil
}
