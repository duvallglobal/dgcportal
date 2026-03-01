import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const ENCODING: BufferEncoding = 'hex'

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is not set')
  // Key must be 32 bytes (64 hex chars) for AES-256
  if (key.length === 64) return Buffer.from(key, 'hex')
  // If not hex, derive a 32-byte key via SHA-256
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a hex string in the format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', ENCODING)
  encrypted += cipher.final(ENCODING)
  const authTag = cipher.getAuthTag()

  return [
    iv.toString(ENCODING),
    authTag.toString(ENCODING),
    encrypted,
  ].join(':')
}

/**
 * Decrypt a string encrypted with encrypt().
 * Expects format: iv:authTag:ciphertext (all hex-encoded)
 */
export function decrypt(encryptedData: string): string {
  const key = getKey()
  const parts = encryptedData.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const [ivHex, authTagHex, ciphertext] = parts
  const iv = Buffer.from(ivHex, ENCODING)
  const authTag = Buffer.from(authTagHex, ENCODING)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, ENCODING, 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
