import { NextRequest, NextResponse } from 'next/server'

/**
 * Yandex Geocoding API endpoint
 * Geocodes an address string to coordinates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Адрес обязателен' },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''
    
    // Yandex Geocoding API endpoint
    const geocodeUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(address)}&format=json&results=1`

    const response = await fetch(geocodeUrl)
    
    if (!response.ok) {
      console.error('Yandex Geocoding API error:', response.statusText)
      return NextResponse.json(
        { error: 'Ошибка при геокодировании адреса' },
        { status: 500 }
      )
    }

    const data = await response.json()

    // Parse Yandex Geocoding response
    const featureMembers = data?.response?.GeoObjectCollection?.featureMember || []
    
    if (featureMembers.length === 0) {
      return NextResponse.json(
        { error: 'Адрес не найден' },
        { status: 404 }
      )
    }

    const geoObject = featureMembers[0].GeoObject
    const pos = geoObject.Point.pos.split(' ') // "lon lat" format
    const longitude = parseFloat(pos[0])
    const latitude = parseFloat(pos[1])

    // Get formatted address from response
    const formattedAddress = geoObject.metaDataProperty?.GeocoderMetaData?.text || address
    const addressDetails = geoObject.metaDataProperty?.GeocoderMetaData?.Address

    return NextResponse.json({
      success: true,
      latitude,
      longitude,
      formattedAddress,
      addressDetails: {
        country: addressDetails?.country_code || null,
        city: addressDetails?.Components?.find((c: any) => c.kind === 'locality')?.name || null,
        street: addressDetails?.Components?.find((c: any) => c.kind === 'street')?.name || null,
        house: addressDetails?.Components?.find((c: any) => c.kind === 'house')?.name || null,
      },
    })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Ошибка при геокодировании адреса', details: String(error) },
      { status: 500 }
    )
  }
}

