import { NextResponse } from 'next/server'
import { deleteSession } from '@/modules/auth/session'

export async function POST() {
  await deleteSession()
  return NextResponse.json({ success: true })
}

