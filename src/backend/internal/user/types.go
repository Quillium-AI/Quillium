package user

// User represents a user in the system
type User struct {
	ID            *int    `json:"id"`
	Username      string  `json:"username"`
	Email         string  `json:"email"`
	PasswordHash  *string `json:"password_hash"`
	IsSso         bool    `json:"is_sso"`
	SsoUserID     *string `json:"sso_user_id"`
	SsoProviderID *int    `json:"sso_provider_id"`
	IsAdmin       bool    `json:"is_admin"`
}
