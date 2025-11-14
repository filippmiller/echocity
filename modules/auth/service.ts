import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getPasswordStrengthError } from '@/lib/password'
import type { Role } from '@prisma/client'

export interface RegisterUserData {
  email: string
  password: string
  fullName?: string
  homeCity?: string
  preferredLanguage?: string
}

export interface RegisterBusinessData {
  email: string
  password: string
  contactName: string
  contactPhone: string
  displayName: string
  legalName?: string
  contactEmail: string
  placeName: string
  placeCategory: string
  placeDescription?: string
  placeCity: string
  placeAddress: string
  placePhone: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    role: Role
  }
  error?: string
  errorCode?: string
}

/**
 * Register a regular user (USER role)
 */
export async function registerUser(data: RegisterUserData): Promise<AuthResult> {
  try {
    // Validate password strength
    const passwordError = getPasswordStrengthError(data.password)
    if (passwordError) {
      return {
        success: false,
        error: passwordError,
        errorCode: 'WEAK_PASSWORD',
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'Email уже используется',
        errorCode: 'EMAIL_EXISTS',
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'USER',
        profile: {
          create: {
            fullName: data.fullName,
            homeCity: data.homeCity,
            preferredLanguage: data.preferredLanguage || 'ru',
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    logger.info('auth.register.user', { userId: user.id, email: user.email })

    return {
      success: true,
      user,
    }
  } catch (error) {
    logger.error('auth.register.user.error', { error: String(error) })
    return {
      success: false,
      error: 'Ошибка при регистрации',
      errorCode: 'REGISTRATION_ERROR',
    }
  }
}

/**
 * Register a business owner with business account and first place
 */
export async function registerBusiness(
  data: RegisterBusinessData
): Promise<AuthResult> {
  try {
    // Validate password strength
    const passwordError = getPasswordStrengthError(data.password)
    if (passwordError) {
      return {
        success: false,
        error: passwordError,
        errorCode: 'WEAK_PASSWORD',
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'Email уже используется',
        errorCode: 'EMAIL_EXISTS',
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Create user, profile, business account, and place in transaction
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'BUSINESS_OWNER',
        profile: {
          create: {
            fullName: data.contactName,
            phone: data.contactPhone,
            preferredLanguage: 'ru',
          },
        },
        businessAccount: {
          create: {
            displayName: data.displayName,
            legalName: data.legalName,
            contactName: data.contactName,
            contactPhone: data.contactPhone,
            contactEmail: data.contactEmail,
            places: {
              create: {
                publicName: data.placeName,
                category: data.placeCategory as any,
                descriptionShort: data.placeDescription,
                city: data.placeCity,
                addressLine1: data.placeAddress,
                phonePublic: data.placePhone,
                isApproved: false,
                isPublished: false,
              },
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    logger.info('auth.register.business', {
      userId: user.id,
      email: user.email,
    })

    return {
      success: true,
      user,
    }
  } catch (error) {
    logger.error('auth.register.business.error', { error: String(error) })
    return {
      success: false,
      error: 'Ошибка при регистрации бизнеса',
      errorCode: 'REGISTRATION_ERROR',
    }
  }
}

/**
 * Login user by email and password
 */
export async function loginUser(data: LoginData): Promise<AuthResult> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    })

    if (!user) {
      logger.warn('auth.login.failed', { email: data.email, reason: 'user_not_found' })
      return {
        success: false,
        error: 'Неверный email или пароль',
        errorCode: 'INVALID_CREDENTIALS',
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        error: 'Аккаунт деактивирован',
        errorCode: 'USER_INACTIVE',
      }
    }

    // Verify password
    const passwordValid = await bcrypt.compare(data.password, user.passwordHash)
    if (!passwordValid) {
      logger.warn('auth.login.failed', { userId: user.id, reason: 'invalid_password' })
      return {
        success: false,
        error: 'Неверный email или пароль',
        errorCode: 'INVALID_CREDENTIALS',
      }
    }

    logger.info('auth.login.success', { userId: user.id, email: user.email })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    }
  } catch (error) {
    logger.error('auth.login.error', { error: String(error) })
    return {
      success: false,
      error: 'Ошибка при входе',
      errorCode: 'LOGIN_ERROR',
    }
  }
}

