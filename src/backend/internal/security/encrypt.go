package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
)

// EncryptionKey should be set during application initialization
// AES-256 requires a 32-byte key
var EncryptionKey []byte

// InitEncryption initializes the encryption system with the provided key
func InitEncryption(key []byte) error {
	if len(key) != 32 {
		return errors.New("encryption key must be 32 bytes (256 bits)")
	}
	EncryptionKey = key
	return nil
}

// EncryptPassword encrypts a password using AES-GCM and returns a base64 encoded string
func EncryptPassword(password string) (*string, error) {
	if EncryptionKey == nil {
		return nil, errors.New("encryption key not initialized")
	}

	// Create a new cipher block from the key
	block, err := aes.NewCipher(EncryptionKey)
	if err != nil {
		return nil, err
	}

	// Create a new GCM cipher mode
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	// Create a nonce (Number used ONCE)
	nonce := make([]byte, aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	// Encrypt and authenticate the plaintext
	ciphertext := aead.Seal(nonce, nonce, []byte(password), nil)

	// Encode to base64 for storage
	encoded := base64.StdEncoding.EncodeToString(ciphertext)
	return &encoded, nil
}
