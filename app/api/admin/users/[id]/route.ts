import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

const VALID_ROLES: Role[] = ['ADMIN', 'CITIZEN', 'BUSINESS_OWNER', 'MERCHANT_STAFF']

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      city: true,
      language: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: {
          avatarUrl: true,
          homeCity: true,
          marketingOptIn: true,
          notificationsEnabled: true,
        },
      },
      subscriptions: {
        select: {
          id: true,
          status: true,
          startAt: true,
          endAt: true,
          autoRenew: true,
          plan: { select: { name: true, code: true, monthlyPrice: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      redemptions: {
        select: {
          id: true,
          status: true,
          redeemedAt: true,
          discountAmount: true,
          offer: { select: { id: true, title: true } },
          branch: { select: { id: true, title: true } },
        },
        orderBy: { redeemedAt: 'desc' },
        take: 10,
      },
      complaints: {
        select: {
          id: true,
          type: true,
          status: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      demandRequests: {
        select: {
          id: true,
          placeName: true,
          status: true,
          supportCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          redemptions: true,
          complaints: true,
          demandRequests: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { isActive, role } = body as { isActive?: boolean; role?: Role }

  // Check user exists
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Cannot modify yourself
  if (id === session.userId) {
    return NextResponse.json(
      { error: 'Нельзя изменить свой собственный аккаунт' },
      { status: 400 },
    )
  }

  // If deactivating an admin, ensure at least one admin remains
  if (isActive === false && existing.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true },
    })
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'Нельзя заблокировать последнего администратора' },
        { status: 400 },
      )
    }
  }

  // If demoting an admin, ensure at least one admin remains
  if (role && role !== 'ADMIN' && existing.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true },
    })
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'Нельзя снять роль администратора — он единственный' },
        { status: 400 },
      )
    }
  }

  // Validate role
  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (typeof isActive === 'boolean') updateData.isActive = isActive
  if (role) updateData.role = role

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  })

  return NextResponse.json({ user: updated })
}
