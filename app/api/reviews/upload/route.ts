import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { uploadFile } from '@/lib/supabase'
import { randomUUID } from 'crypto'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * POST /api/reviews/upload — upload a review photo
 * Accepts multipart/form-data with a "file" field.
 * Returns { url: string }
 */
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходимо войти в аккаунт' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Неверный формат запроса' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Файл не найден в запросе' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Разрешены только форматы JPEG, PNG и WebP' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Размер файла не должен превышать 5 МБ' },
      { status: 400 }
    )
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const key = `reviews/${session.userId}/${randomUUID()}.${ext}`

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadFile(key, buffer, file.type)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[review-upload] Storage error:', err)
    // Fallback: return a data URL so the review can still be submitted
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`
    return NextResponse.json({ url: dataUrl })
  }
}
