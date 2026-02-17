import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { uploadFile } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { randomBytes } from 'crypto'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// GET /api/profile/photos - Get user photos
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const photos = await prisma.userPhoto.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ photos })
  } catch (error) {
    logger.error('photos.get.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении фотографий' },
      { status: 500 }
    )
  }
}

// POST /api/profile/photos - Upload photo
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не предоставлен' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый тип файла. Используйте JPEG, PNG или WebP' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимальный размер: 5MB' },
        { status: 400 }
      )
    }

    const fileExt = file.name.split('.').pop() || 'jpg'
    const key = `photos/${session.userId}/${Date.now()}-${randomBytes(8).toString('hex')}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const publicUrl = await uploadFile(key, buffer, file.type)

    const photo = await prisma.userPhoto.create({
      data: {
        userId: session.userId,
        url: publicUrl,
        isAvatar: false,
      },
    })

    return NextResponse.json({ success: true, photo })
  } catch (error) {
    logger.error('photos.upload.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при загрузке фотографии' },
      { status: 500 }
    )
  }
}
