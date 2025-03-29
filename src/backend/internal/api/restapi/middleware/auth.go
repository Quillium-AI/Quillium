package middleware

import (
	"net/http"
	"strings"
	"strconv"
	"time"

	"github.com/Quillium-AI/Quillium/src/backend/internal/db"
	"github.com/golang-jwt/jwt/v5"
	"github.com/Quillium-AI/Quillium/src/backend/internal/security"
)

var jwtSecret []byte
var dbConn *db.DB

// InitAuth initializes the authentication middleware
func InitAuth(secret []byte, db *db.DB) {
	jwtSecret = secret
	dbConn = db
}

// AuthType represents the type of authentication
type AuthType int

const (
	// AuthTypeNone means no authentication required
	AuthTypeNone AuthType = iota
	// AuthTypeFrontend means frontend authentication required (JWT)
	AuthTypeFrontend
	// AuthTypeAPI means API key authentication required
	AuthTypeAPI
	// AuthTypeAny means either frontend or API authentication is acceptable
	AuthTypeAny
)

// Claims represents the JWT claims
type Claims struct {
	UserID   string `json:"user_id"`
	IsAdmin  bool   `json:"is_admin"`
	jwt.RegisteredClaims
}

// WithAuth middleware checks for authentication based on the specified type
func WithAuth(authType AuthType, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if authType == AuthTypeNone {
			next(w, r)
			return
		}

		// Check for API key authentication
		apiKey := r.Header.Get("X-API-Key")
		if apiKey != "" && (authType == AuthTypeAPI || authType == AuthTypeAny) {
			// Validate API key
			valid, userID := validateAPIKey(apiKey)
			if valid {
				// Add user info to request context
				ctx := r.Context()
				ctx = AddUserToContext(ctx, userID, false, true)
				next(w, r.WithContext(ctx))
				return
			}
		}

		// Check for JWT authentication (frontend)
		if authType == AuthTypeFrontend || authType == AuthTypeAny {
			authorization := r.Header.Get("Authorization")
			if authorization != "" && strings.HasPrefix(authorization, "Bearer ") {
				tokenString := strings.TrimPrefix(authorization, "Bearer ")

				// Parse and validate JWT token
				claims := &Claims{}
				token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
					return jwtSecret, nil
				})

				if err == nil && token.Valid {
					// Add user info to request context
					ctx := r.Context()
					ctx = AddUserToContext(ctx, claims.UserID, claims.IsAdmin, false)
					next(w, r.WithContext(ctx))
					return
				}
			}

			// Check for cookie-based authentication
			cookie, err := r.Cookie("auth_token")
			if err == nil && cookie.Value != "" {
				// Parse and validate JWT token from cookie
				claims := &Claims{}
				token, err := jwt.ParseWithClaims(cookie.Value, claims, func(token *jwt.Token) (interface{}, error) {
					return jwtSecret, nil
				})

				if err == nil && token.Valid {
					// Add user info to request context
					ctx := r.Context()
					ctx = AddUserToContext(ctx, claims.UserID, claims.IsAdmin, false)
					next(w, r.WithContext(ctx))
					return
				}
			}
		}

		// Authentication failed
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"Unauthorized"}`)) 
	}
}

// validateAPIKey checks if the API key is valid and returns the associated user ID
func validateAPIKey(apiKey string) (bool, string) {
	if dbConn == nil || apiKey == "" {
		return false, ""
	}

	// Get the user ID associated with this API key
	// First we need to encrypt the API key to match how it's stored
	encryptedKey, err := security.EncryptPassword(apiKey)
	if err != nil {
		return false, ""
	}

	// Try to find a user with this API key
	userID, err := dbConn.GetUserByApikey(*encryptedKey)
	if err != nil {
		return false, ""
	}

	// Return the user ID as a string
	return true, strconv.Itoa(userID)
}

// GenerateJWT creates a new JWT token for a user
func GenerateJWT(userID string, isAdmin bool) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:  userID,
		IsAdmin: isAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "quillium-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	return tokenString, err
}
