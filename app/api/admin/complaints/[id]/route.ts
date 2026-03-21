import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { ComplaintStatus } from '@prisma/client'

const VALID_STATUSES: ComplaintStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']

const updateComplaintSchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']).optional(),
  adminNote: z.string().max(5000).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: z.infer<typeof updateComplaintSchema>
  try {
    body = updateComplaintSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Check complaint exists
  const existing = await prisma.complaint.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}

  if (body.status) {
    updateData.status = body.status
    if (body.status === 'RESOLVED' || body.status === 'DISMISSED') {
      updateData.resolvedAt = new Date()
      updateData.resolvedById = session.userId
    }
  }

  if (body.adminNote !== undefined) {
    updateData.adminNote = body.adminNote
  }

  const complaint = await prisma.complaint.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ complaint })
}
