import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/password'

async function createAdmin() {
  const email = 'filippmiller@gmail.com'
  const password = 'Airbus380+'
  const firstName = 'Filipp'
  const lastName = 'Miller'

  try {
    const passwordHash = await hashPassword(password)

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        passwordHash,
        firstName,
        lastName,
      },
      create: {
        email,
        passwordHash,
        role: 'ADMIN',
        firstName,
        lastName,
        city: 'Санкт-Петербург',
        language: 'ru',
        isActive: true,
      },
    })

    console.log('Admin user ready:', user.email, user.role)
  } catch (error) {
    console.error('Error creating admin:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
