/**
 * Password validation and strength checking
 */

const WEAK_PASSWORDS = [
  '1234',
  '12345',
  '123456',
  '111111',
  'qwerty',
  'qwerty123',
  'password',
  'password1',
  'admin',
  'admin123',
]

/**
 * Check if password is strong enough
 */
export function isStrongPassword(password: string): boolean {
  if (!password || password.length < 8) {
    return false
  }

  // Check for weak passwords
  const lowerPassword = password.toLowerCase()
  if (WEAK_PASSWORDS.includes(lowerPassword)) {
    return false
  }

  // Must contain at least one letter
  const hasLetter = /[a-zA-Zа-яА-Я]/.test(password)
  if (!hasLetter) {
    return false
  }

  // Must contain at least one digit
  const hasDigit = /\d/.test(password)
  if (!hasDigit) {
    return false
  }

  return true
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

  const hasLetter = /[a-zA-Zа-яА-Я]/.test(password)
  const hasDigit = /\d/.test(password)

  if (!hasLetter || !hasDigit) {
    return 'Пароль должен содержать буквы и цифры'
  }

  return null
}

/**
 * Check if password has special characters (optional requirement)
 */
export function hasSpecialCharacters(password: string): boolean {
  return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
}

