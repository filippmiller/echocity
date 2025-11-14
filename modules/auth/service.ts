import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getPasswordStrengthError } from '@/lib/password'
import type { Role } from '@prisma/client'

export interface RegisterUserData {
  email: string
  password: string
  firstName: string
  lastName?: string
  phone?: string
  city?: string
  language?: 'ru' | 'en'
}

export interface RegisterBusinessData {
  // Step 1: Contact person
  email: string
  password: string
  firstName: string
  lastName?: string
  phone: string
  
  // Step 2: Business data
  businessName: string
  legalName?: string
  businessType: string
  description?: string
  website?: string
  instagram?: string
  vk?: string
  telegram?: string
  supportEmail?: string
  supportPhone?: string
  
  // Step 3: First place
  placeTitle: string
  placeCity: string
  placeAddress: string
  placeLat?: number
  placeLng?: number
  placePhone?: string
  placeType: string
  hasWorkspace?: boolean
  hasWifi?: boolean
  hasSockets?: boolean
  isSpecialtyCoffee?: boolean
  hasParking?: boolean
  isKidsFriendly?: boolean
  openingHours?: any
  averageCheck?: number
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
 * Register a regular user (CITIZEN role)
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
        role: 'CITIZEN',
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        city: data.city || 'Санкт-Петербург',
        language: data.language || 'ru',
        profile: {
          create: {
            fullName: data.firstName + (data.lastName ? ` ${data.lastName}` : ''),
            homeCity: data.city || 'Санкт-Петербург',
            preferredLanguage: data.language || 'ru',
            phone: data.phone,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    logger.info('auth.register.citizen', { userId: user.id, email: user.email })

    return {
      success: true,
      user,
    }
  } catch (error) {
    logger.error('auth.register.citizen.error', { error: String(error) })
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

    // Create user, profile, business, and place in transaction
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'BUSINESS_OWNER',
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        city: data.placeCity || 'Санкт-Петербург',
        language: 'ru',
        profile: {
          create: {
            fullName: data.firstName + (data.lastName ? ` ${data.lastName}` : ''),
            phone: data.phone,
            preferredLanguage: 'ru',
          },
        },
        businesses: {
          create: {
            name: data.businessName,
            legalName: data.legalName,
            type: data.businessType as any,
            description: data.description,
            website: data.website,
            instagram: data.instagram,
            vk: data.vk,
            telegram: data.telegram,
            supportEmail: data.supportEmail,
            supportPhone: data.supportPhone,
            status: 'PENDING',
            places: {
              create: {
                title: data.placeTitle,
                city: data.placeCity,
                address: data.placeAddress,
                lat: data.placeLat,
                lng: data.placeLng,
                phone: data.placePhone,
                placeType: data.placeType as any,
                hasWorkspace: data.hasWorkspace || false,
                hasWifi: data.hasWifi || false,
                hasSockets: data.hasSockets || false,
                isSpecialtyCoffee: data.isSpecialtyCoffee || false,
                hasParking: data.hasParking || false,
                isKidsFriendly: data.isKidsFriendly || false,
                openingHours: data.openingHours,
                averageCheck: data.averageCheck,
                isActive: true,
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

