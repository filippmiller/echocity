import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { deleteFile, getKeyFromUrl } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// PATCH /api/profile/photos/[photoId] - Update photo (set as avatar)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { photoId } = await params
    const body = await request.json()
    const { isAvatar } = body

    const photo = await prisma.userPhoto.findFirst({
      where: { id: photoId, userId: session.userId },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Фотография не найдена' },
        { status: 404 }
      )
    }

    if (isAvatar === true) {
      await prisma.userPhoto.updateMany({
        where: { userId: session.userId, isAvatar: true },
        data: { isAvatar: false },
      })

      await prisma.userProfile.upsert({
        where: { userId: session.userId },
        create: { userId: session.userId, avatarUrl: photo.url },
        update: { avatarUrl: photo.url },
      })
    }

    const updatedPhoto = await prisma.userPhoto.update({
      where: { id: photoId },
      data: { isAvatar: isAvatar === true },
    })

    return NextResponse.json({ success: true, photo: updatedPhoto })
  } catch (error) {
    logger.error('photos.update.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при обновлении фотографии' },
      { status: 500 }
    )
  }
}

// DELETE /api/profile/photos/[photoId] - Delete photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { photoId } = await params

    const photo = await prisma.userPhoto.findFirst({
      where: { id: photoId, userId: session.userId },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Фотография не найдена' },
        { status: 404 }
      )
    }

    // Delete from MinIO
    try {
      const key = getKeyFromUrl(photo.url)
      await deleteFile(key)
    } catch (storageError) {
      logger.error('photos.delete.storage.error', { error: String(storageError) })
      // Continue with DB deletion even if storage deletion fails
    }

    await prisma.userPhoto.delete({ where: { id: photoId } })

    if (photo.isAvatar) {
      await prisma.userProfile.update({
        where: { userId: session.userId },
        data: { avatarUrl: null },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('photos.delete.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при удалении фотографии' },
      { status: 500 }
    )
  }
}
