import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { ComplaintStatus } from '@prisma/client'

const VALID_STATUSES: ComplaintStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']

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
  const { status, adminNote } = body

  // Validate status if provided
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Check complaint exists
  const existing = await prisma.complaint.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}

  if (status) {
    updateData.status = status
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      updateData.resolvedAt = new Date()
      updateData.resolvedById = session.userId
    }
  }

  if (adminNote !== undefined) {
    updateData.adminNote = adminNote
  }

  const complaint = await prisma.complaint.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ complaint })
}
