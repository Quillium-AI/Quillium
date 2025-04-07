package sso

// SsoProvider represents an SSO provider configuration
type SsoProvider struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
	Provider     string `json:"provider"`
	RedirectURL  string `json:"redirect_url"`
	AuthType     string `json:"auth_type"` // OAuth2, SAML, or OIDC
}
