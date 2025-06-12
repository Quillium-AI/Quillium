package user

import (
	"encoding/json"

	"golang.org/x/crypto/bcrypt"
)

// ToJSON converts the struct to a JSON string
func (u *User) ToJSON() (string, error) {
	bytes, err := json.Marshal(u)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// FromJSON parses a JSON string into the struct
func (u *User) FromJSON(jsonStr string) error {
	return json.Unmarshal([]byte(jsonStr), u)
}

func (u *User) ValidatePassword(password string) bool {
	if u.PasswordHash == nil {
		return false
	}
	return bcrypt.CompareHashAndPassword([]byte(*u.PasswordHash), []byte(password)) == nil
}
