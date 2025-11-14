import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const createFranchiseSchema = z.object({
  code: z.string().min(1, 'Код франшизы обязателен').regex(/^[A-Z0-9-_]+$/, 'Код может содержать только заглавные буквы, цифры, дефисы и подчеркивания'),
  name: z.string().min(1, 'Название франшизы обязательно'),
  ownerUserEmail: z.string().email('Некорректный email'),
  status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED']).optional(),
  billingEmail: z.string().email().optional().or(z.literal('')),
  billingPlan: z.string().optional(),
  revenueSharePercent: z.number().int().min(0).max(100).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const franchises = await prisma.franchise.findMany({
      include: {
        ownerUser: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            cities: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ franchises })
  } catch (error) {
    logger.error('admin.franchises.list.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении списка франшиз' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validated = createFranchiseSchema.parse(body)

    // Check if code already exists
    const existingFranchise = await prisma.franchise.findUnique({
      where: { code: validated.code },
    })

    if (existingFranchise) {
      return NextResponse.json(
        { error: 'Франшиза с таким кодом уже существует' },
        { status: 409 }
      )
    }

    // Find user by email
    const ownerUser = await prisma.user.findUnique({
      where: { email: validated.ownerUserEmail },
    })

    if (!ownerUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email не найден' },
        { status: 404 }
      )
    }

    const franchise = await prisma.franchise.create({
      data: {
        code: validated.code,
        name: validated.name,
        ownerUserId: ownerUser.id,
        status: validated.status || 'ACTIVE',
        billingEmail: validated.billingEmail || null,
        billingPlan: validated.billingPlan || null,
        revenueSharePercent: validated.revenueSharePercent || null,
      },
      include: {
        ownerUser: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            cities: true,
            members: true,
          },
        },
      },
    })

    // Create franchise member with OWNER role
    await prisma.franchiseMember.create({
      data: {
        franchiseId: franchise.id,
        userId: ownerUser.id,
        role: 'OWNER',
        isActive: true,
      },
    })

    logger.info('admin.franchise.created', {
      franchiseId: franchise.id,
      code: franchise.code,
      ownerUserId: ownerUser.id,
    })

    return NextResponse.json({ franchise }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('admin.franchise.create.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при создании франшизы' },
      { status: 500 }
    )
  }
}


