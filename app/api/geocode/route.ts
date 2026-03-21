import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

/**
 * Yandex Geocoding API endpoint
 * Geocodes an address string to coordinates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address || address.length > 500) {
      return NextResponse.json(
        { error: 'Адрес обязателен (макс. 500 символов)' },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''

    const geocodeUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(address)}&format=json&results=1`

    const response = await fetch(geocodeUrl)

    if (!response.ok) {
      logger.error('geocode.yandex.error', { status: response.status })
      return NextResponse.json(
        { error: 'Ошибка при геокодировании адреса' },
        { status: 500 }
      )
    }

    const data = await response.json()

    const featureMembers = data?.response?.GeoObjectCollection?.featureMember || []

    if (featureMembers.length === 0) {
      return NextResponse.json(
        { error: 'Адрес не найден' },
        { status: 404 }
      )
    }

    const geoObject = featureMembers[0].GeoObject
    const pos = geoObject.Point.pos.split(' ')
    const longitude = parseFloat(pos[0])
    const latitude = parseFloat(pos[1])

    const formattedAddress = geoObject.metaDataProperty?.GeocoderMetaData?.text || address
    const addressDetails = geoObject.metaDataProperty?.GeocoderMetaData?.Address

    return NextResponse.json({
      success: true,
      latitude,
      longitude,
      formattedAddress,
      addressDetails: {
        country: addressDetails?.country_code || null,
        city: addressDetails?.Components?.find((c: { kind: string; name: string }) => c.kind === 'locality')?.name || null,
        street: addressDetails?.Components?.find((c: { kind: string; name: string }) => c.kind === 'street')?.name || null,
        house: addressDetails?.Components?.find((c: { kind: string; name: string }) => c.kind === 'house')?.name || null,
      },
    })
  } catch (error) {
    logger.error('geocode.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при геокодировании адреса' },
      { status: 500 }
    )
  }
}
