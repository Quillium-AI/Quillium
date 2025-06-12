package middleware

import (
	"crypto/rand"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/db"
	"gitlab.cherkaoui.ch/quillium-ai/quillium/src/backend/internal/security"
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
	UserID  int  `json:"user_id"`
	IsAdmin bool `json:"is_admin"`
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
func validateAPIKey(apiKey string) (bool, int) {
	if dbConn == nil || apiKey == "" {
		return false, -1
	}

	encryptedKey, err := security.EncryptPassword(apiKey)
	if err != nil {
		return false, -1
	}

	// Try to find a user with this API key
	userID, err := dbConn.GetUserByApikey(*encryptedKey)
	if err == nil {
		return true, userID
	}

	// If we didn't find a match, let's try a different approach
	// Get all users
	users, err := dbConn.GetUsers()
	if err != nil {
		return false, -1
	}

	// For each user, get their API keys and check if any match
	for _, u := range users {
		apiKeys, err := dbConn.GetUserApikeys(u)
		if err != nil {
			continue
		}

		for _, encryptedAPIKey := range apiKeys {
			// Decrypt the stored API key
			decryptedKey, err := security.DecryptPassword(encryptedAPIKey)
			if err != nil || decryptedKey == nil {
				continue
			}

			// Compare with the provided API key
			if *decryptedKey == apiKey {
				// We found a match
				return true, *u.ID
			}
		}
	}

	return false, -1
}

// GenerateToken generates a JWT token for the given user ID
func GenerateToken(userID int, isAdmin bool, expiration time.Duration) (string, error) {
	expirationTime := time.Now().Add(expiration)
	claims := &Claims{
		UserID:  userID,
		IsAdmin: isAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// GenerateJWT creates a new JWT token for a user with a short expiration time (15 minutes)
func GenerateJWT(userID int, isAdmin bool) (string, error) {
	// Short-lived access token (15 minutes)
	expirationTime := time.Now().Add(15 * time.Minute)
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

// GenerateRefreshToken creates a new refresh token for a user
func GenerateRefreshToken() (string, error) {
	// Generate a random string for the refresh token
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", b), nil
}

// RefreshJWT refreshes a JWT token using a valid refresh token
func RefreshJWT(refreshToken string) (string, int, bool, error) {
	if dbConn == nil {
		return "", 0, false, errors.New("database connection not initialized")
	}

	// Validate refresh token and get user ID
	userID, err := dbConn.GetRefreshToken(refreshToken)
	if err != nil {
		return "", 0, false, err
	}

	// Get user data to check if admin
	id := userID // Create a copy to use with pointer
	userData, err := dbConn.GetUser(nil, &id)
	if err != nil || userData == nil {
		return "", 0, false, errors.New("user not found")
	}

	// Generate new JWT token
	newToken, err := GenerateJWT(userID, userData.IsAdmin)
	if err != nil {
		return "", 0, false, err
	}

	return newToken, userID, userData.IsAdmin, nil
}
