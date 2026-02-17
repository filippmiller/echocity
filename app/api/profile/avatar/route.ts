import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { uploadFile, STORAGE_BUCKET } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { randomBytes } from 'crypto'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// POST /api/profile/avatar - Upload avatar
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
    const key = `avatars/${session.userId}/${Date.now()}-${randomBytes(8).toString('hex')}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    logger.info('avatar.upload.start', { bucket: STORAGE_BUCKET, key, size: buffer.length })

    const publicUrl = await uploadFile(key, buffer, file.type)

    // Unset previous avatar
    const existingPhoto = await prisma.userPhoto.findFirst({
      where: { userId: session.userId, isAvatar: true },
    })
    if (existingPhoto) {
      await prisma.userPhoto.update({
        where: { id: existingPhoto.id },
        data: { isAvatar: false },
      })
    }

    const photo = await prisma.userPhoto.create({
      data: {
        userId: session.userId,
        url: publicUrl,
        isAvatar: true,
      },
    })

    await prisma.userProfile.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, avatarUrl: publicUrl },
      update: { avatarUrl: publicUrl },
    })

    return NextResponse.json({ success: true, avatarUrl: publicUrl, photo })
  } catch (error) {
    logger.error('avatar.upload.error', { error: String(error) })
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке аватара', details: errorMessage },
      { status: 500 }
    )
  }
}
