package user

// User represents a user in the system
type User struct {
	Email         string  `json:"email"`
	PasswordHash  *string `json:"password_hash,omitempty"`
	IsSso         bool    `json:"is_sso"`
	SsoUserID     *string `json:"sso_user_id,omitempty"`
	SsoProviderID *int    `json:"sso_provider_id,omitempty"`
	IsAdmin       bool    `json:"is_admin"`
}
