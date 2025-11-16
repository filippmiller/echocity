import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { getSupabaseAdmin, USER_PHOTOS_BUCKET } from '@/lib/supabase'
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

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый тип файла. Используйте JPEG, PNG или WebP' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимальный размер: 5MB' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify bucket exists
    const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets()
    if (bucketListError) {
      console.error('Error listing buckets:', bucketListError)
    } else {
      const bucketExists = buckets?.some(b => b.name === USER_PHOTOS_BUCKET)
      if (!bucketExists) {
        return NextResponse.json(
          { error: `Bucket "${USER_PHOTOS_BUCKET}" does not exist. Please create it first.` },
          { status: 500 }
        )
      }
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${session.userId}/${Date.now()}-${randomBytes(8).toString('hex')}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log(`Uploading to bucket: ${USER_PHOTOS_BUCKET}, path: ${filePath}, size: ${buffer.length}`)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(USER_PHOTOS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      logger.error('avatar.upload.storage.error', { error: String(uploadError) })
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Ошибка при загрузке файла', details: String(uploadError) },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(USER_PHOTOS_BUCKET).getPublicUrl(filePath)

    // Update or create UserPhoto record
    const existingPhoto = await prisma.userPhoto.findFirst({
      where: {
        userId: session.userId,
        isAvatar: true,
      },
    })

    // Unset previous avatar
    if (existingPhoto) {
      await prisma.userPhoto.update({
        where: { id: existingPhoto.id },
        data: { isAvatar: false },
      })
    }

    // Create new photo record
    const photo = await prisma.userPhoto.create({
      data: {
        userId: session.userId,
        url: publicUrl,
        isAvatar: true,
      },
    })

    // Update UserProfile avatarUrl
    await prisma.userProfile.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        avatarUrl: publicUrl,
      },
      update: {
        avatarUrl: publicUrl,
      },
    })

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl,
      photo,
    })
  } catch (error) {
    logger.error('avatar.upload.error', { error: String(error) })
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Avatar upload error:', errorMessage)
    return NextResponse.json(
      { error: 'Ошибка при загрузке аватара', details: errorMessage },
      { status: 500 }
    )
  }
}

