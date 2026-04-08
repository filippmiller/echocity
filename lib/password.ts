/**
 * Password validation, strength checking, and hashing.
 * Single source of truth for all password operations.
 */

import bcrypt from 'bcrypt'

const BCRYPT_ROUNDS = 10

/** Hash a plaintext password. Use this everywhere — do NOT call bcrypt.hash directly. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/** Compare plaintext against hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

const WEAK_PASSWORDS = [
  '1234', '12345', '123456', '1234567', '12345678', '123456789',
  '111111', '000000', 'qwerty', 'qwerty123', 'qwerty1',
  'password', 'password1', 'password123',
  'admin', 'admin123', 'admin1',
  'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'login', 'abc123', 'iloveyou',
  'trustno1', 'sunshine', 'princess', 'football',
  'shadow', 'superman', 'michael', 'charlie',
  'пароль', 'йцукен', 'привет', 'любовь',
]

/**
 * Check if password is strong enough.
 * Requires: 8+ chars, at least one uppercase, one lowercase, one digit.
 */
export function isStrongPassword(password: string): boolean {
  return getPasswordStrengthError(password) === null
}

/**
 * Get password strength error message or null if password is valid
 */
export function getPasswordStrengthError(password: string): string | null {
  if (!password) {
    return 'Пароль обязателен'
  }

  if (password.length < 8) {
    return 'Пароль должен содержать минимум 8 символов'
  }

  const lowerPassword = password.toLowerCase()
  if (WEAK_PASSWORDS.includes(lowerPassword)) {
    return 'Пароль слишком простой, выберите более сложный'
  }

  const hasLower = /[a-zа-я]/.test(password)
  const hasUpper = /[A-ZА-Я]/.test(password)
  const hasDigit = /\d/.test(password)

  if (!hasLower || !hasUpper) {
    return 'Пароль должен содержать заглавные и строчные буквы'
  }

  if (!hasDigit) {
    return 'Пароль должен содержать хотя бы одну цифру'
  }

  return null
}

/**
 * Check if password has special characters (optional requirement)
 */
export function hasSpecialCharacters(password: string): boolean {
  return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
}
