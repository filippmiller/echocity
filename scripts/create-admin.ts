import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/password'

async function createAdmin() {
  const email = 'filippmiller@gmail.com'
  const password = 'Airbus380+'
  const firstName = 'Filipp'
  const lastName = 'Miller'

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Update existing user to ADMIN role
      const passwordHash = await hashPassword(password)
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          passwordHash,
          firstName,
          lastName,
        },
      })
      console.log('✅ User updated to ADMIN:', updatedUser.email)
    } else {
      // Create new admin user
      const passwordHash = await hashPassword(password)
      const newUser = await prisma.user.create({
        data: {
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
      console.log('✅ Admin user created:', newUser.email)
    }

    // Verify the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    })

    console.log('\n📋 User details:')
    console.log(JSON.stringify(user, null, 2))
    console.log('\n✅ Admin user ready!')
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

