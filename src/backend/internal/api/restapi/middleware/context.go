package middleware

import (
	"context"
)

type contextKey string

const (
	userIDKey     contextKey = "user_id"
	isAdminKey    contextKey = "is_admin"
	isAPIClientKey contextKey = "is_api_client"
)

// UserIDKey returns the context key for user ID
func UserIDKey() contextKey {
	return userIDKey
}

// IsAdminKey returns the context key for admin status
func IsAdminKey() contextKey {
	return isAdminKey
}

// IsAPIClientKey returns the context key for API client status
func IsAPIClientKey() contextKey {
	return isAPIClientKey
}

// AddUserToContext adds user information to the request context
func AddUserToContext(ctx context.Context, userID int, isAdmin bool, isAPIClient bool) context.Context {
	ctx = context.WithValue(ctx, userIDKey, userID)
	ctx = context.WithValue(ctx, isAdminKey, isAdmin)
	ctx = context.WithValue(ctx, isAPIClientKey, isAPIClient)
	return ctx
}

// GetUserID retrieves the user ID from the context
func GetUserID(ctx context.Context) (int, bool) {
	userID, ok := ctx.Value(userIDKey).(int)
	return userID, ok
}

// IsAdmin checks if the user is an admin
func IsAdmin(ctx context.Context) bool {
	isAdmin, ok := ctx.Value(isAdminKey).(bool)
	return ok && isAdmin
}

// IsAPIClient checks if the request is from an API client
func IsAPIClient(ctx context.Context) bool {
	isAPIClient, ok := ctx.Value(isAPIClientKey).(bool)
	return ok && isAPIClient
}
