import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const linkSchema = z.object({
  yandexOrgId: z.string().min(1, 'Yandex organization ID is required'),
  yandexData: z.any().optional(), // Full Yandex feature object
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: businessId } = await params

    // Find business and verify ownership
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        ownerId: true,
        name: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Check if user is owner or admin
    if (business.ownerId !== session.userId && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: You are not the owner of this business' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validation = linkSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { yandexOrgId, yandexData } = validation.data

    // Extract data from Yandex feature object if provided
    let yandexOrgName: string | null = null
    let updateData: any = {
      yandexOrgId,
      yandexOrgRaw: yandexData || null,
      yandexVerifiedAt: new Date(),
      yandexVerificationMethod: 'places_api_soft',
    }

    if (yandexData) {
      // Extract name
      const companyMetaData = yandexData?.properties?.CompanyMetaData || {}
      yandexOrgName = companyMetaData.name || yandexData?.properties?.name || null

      if (yandexOrgName) {
        updateData.yandexOrgName = yandexOrgName
      }

      // Get first place to update address/coordinates/phone
      const firstPlace = await prisma.place.findFirst({
        where: { businessId: business.id },
      })

      if (firstPlace) {
        const updatePlaceData: any = {}

        // Extract and update address if our address is empty
        const yandexAddress = companyMetaData.address || yandexData?.properties?.description
        if (yandexAddress && !firstPlace.address) {
          updatePlaceData.address = yandexAddress
        }

        // Extract and update coordinates if our coordinates are missing
        const coordinates = yandexData?.geometry?.coordinates
        if (coordinates && coordinates.length >= 2 && (!firstPlace.lat || !firstPlace.lng)) {
          updatePlaceData.lat = coordinates[1] // latitude
          updatePlaceData.lng = coordinates[0] // longitude
          updatePlaceData.latitude = coordinates[1]
          updatePlaceData.longitude = coordinates[0]
        }

        // Extract and update phone if our phone is empty
        const phones = companyMetaData?.Phones || []
        if (phones.length > 0 && !firstPlace.phone) {
          const firstPhone = phones[0]?.formatted || phones[0]?.value
          if (firstPhone) {
            updatePlaceData.phone = firstPhone
            updatePlaceData.phonePublic = firstPhone
          }
        }

        // Update place if we have any data to update
        if (Object.keys(updatePlaceData).length > 0) {
          await prisma.place.update({
            where: { id: firstPlace.id },
            data: updatePlaceData,
          })
        }
      }
    }

    // Update business with Yandex data
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        name: true,
        yandexOrgId: true,
        yandexOrgName: true,
        yandexVerifiedAt: true,
        yandexVerificationMethod: true,
      },
    })

    logger.info('yandex.business.link.success', {
      userId: session.userId,
      businessId,
      yandexOrgId,
    })

    return NextResponse.json({
      success: true,
      business: updatedBusiness,
    })
  } catch (error) {
    logger.error('yandex.business.link.error', {
      error: String(error),
      businessId: (await params).id,
    })
    return NextResponse.json(
      { error: 'Failed to link business with Yandex' },
      { status: 500 }
    )
  }
}

