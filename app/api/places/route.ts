import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'

// GET /api/places - Get all active places for map
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('cityId')
    const bounds = searchParams.get('bounds') // "lat1,lon1,lat2,lon2"

    const where: any = {
      isActive: true,
      OR: [
        { isPublished: true },
        { isApproved: true }, // Also include approved places
      ],
    }

    if (cityId) {
      where.cityId = cityId
    }

    // Filter by bounds if provided
    if (bounds) {
      const [lat1, lon1, lat2, lon2] = bounds.split(',').map(Number)
      const minLat = Math.min(lat1, lat2)
      const maxLat = Math.max(lat1, lat2)
      const minLon = Math.min(lon1, lon2)
      const maxLon = Math.max(lon1, lon2)
      
      // Add bounds filter using AND with existing conditions
      where.AND = [
        {
          OR: [
            {
              lat: { gte: minLat, lte: maxLat },
              lng: { gte: minLon, lte: maxLon },
            },
            {
              latitude: { gte: minLat, lte: maxLat },
              longitude: { gte: minLon, lte: maxLon },
            },
          ],
        },
      ]
    }

    const places = await prisma.place.findMany({
      where,
      select: {
        id: true,
        title: true,
        lat: true,
        lng: true,
        latitude: true,
        longitude: true,
        address: true,
        addressLine1: true,
        placeType: true,
        cityId: true,
        businessId: true,
      },
      take: 100, // Limit for performance
    })

    // Map to consistent format for frontend
    const mappedPlaces = places.map((p) => ({
      id: p.id,
      name: p.title || 'Без названия',
      latitude: p.lat || p.latitude,
      longitude: p.lng || p.longitude,
      addressLine1: p.addressLine1 || p.address,
      placeType: p.placeType,
    }))

    return NextResponse.json({ places: mappedPlaces })
  } catch (error) {
    console.error('Error fetching places:', error)
    return NextResponse.json({ error: 'Ошибка при загрузке мест' }, { status: 500 })
  }
}

// POST /api/places - Create a new place (for testing)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, latitude, longitude, addressLine1, cityId, placeType } = body

    if (!name || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Название, широта и долгота обязательны' },
        { status: 400 }
      )
    }

    // For testing: find or create a Business for the user
    let business = await prisma.business.findFirst({
      where: { ownerId: session.userId },
    })

    if (!business) {
      // Create a test business for the user
      business = await prisma.business.create({
        data: {
          ownerId: session.userId,
          name: 'Test Business',
          type: 'OTHER',
          status: 'APPROVED',
        },
      })
    }

    // Get default city (St. Petersburg) if cityId not provided
    let defaultCityId = cityId
    if (!defaultCityId) {
      const defaultCity = await prisma.city.findFirst({
        where: { slug: 'spb' },
      })
      if (defaultCity) {
        defaultCityId = defaultCity.id
      }
    }

    // Create the place
    const place = await prisma.place.create({
      data: {
        title: name,
        city: 'Санкт-Петербург', // Required field
        address: addressLine1 || name, // Required field
        lat: parseFloat(latitude), // Primary coordinates
        lng: parseFloat(longitude),
        latitude: parseFloat(latitude), // Legacy coordinates
        longitude: parseFloat(longitude),
        addressLine1: addressLine1 || null, // Legacy field
        cityId: defaultCityId || null,
        placeType: (placeType as any) || 'OTHER', // BusinessType enum
        businessId: business.id,
        isActive: true,
        isPublished: true,
        country: 'RU',
      },
    })

    // Return mapped place
    const mappedPlace = {
      id: place.id,
      name: place.title || 'Без названия',
      latitude: place.lat || place.latitude,
      longitude: place.lng || place.longitude,
      addressLine1: place.addressLine1 || place.address,
      placeType: place.placeType,
    }

    return NextResponse.json({ place: mappedPlace })
  } catch (error) {
    console.error('Error creating place:', error)
    return NextResponse.json({ error: 'Ошибка при создании места' }, { status: 500 })
  }
}

