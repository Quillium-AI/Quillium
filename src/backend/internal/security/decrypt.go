package security

import (
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
	"errors"
)

// DecryptPassword decrypts a base64 encoded, AES-GCM encrypted password
func DecryptPassword(encryptedPassword string) (*string, error) {
	if EncryptionKey == nil {
		return nil, errors.New("encryption key not initialized")
	}

	// Decode from base64
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedPassword)
	if err != nil {
		return nil, err
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

	// Extract the nonce from the ciphertext
	nonceSize := aead.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	// Decrypt and verify the ciphertext
	plaintext, err := aead.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	password := string(plaintext)
	return &password, nil
}
