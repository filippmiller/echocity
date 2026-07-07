import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetSession,
  mockListReferralsForAdmin,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockListReferralsForAdmin: vi.fn(),
}))

vi.mock('@/modules/auth/session', () => ({
  getSession: mockGetSession,
}))

vi.mock('@/modules/referrals/service', () => ({
  listReferralsForAdmin: mockListReferralsForAdmin,
}))

import { GET } from '@/app/api/admin/referrals/route'

function getRequest(url: string) {
  return new NextRequest(url)
}

describe('admin referrals API route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for unauthenticated users', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await GET(getRequest('http://localhost/api/admin/referrals'))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 for non-admin users', async () => {
    mockGetSession.mockResolvedValue({ userId: 'u1', email: 'u@example.com', role: 'CITIZEN' })

    const response = await GET(getRequest('http://localhost/api/admin/referrals'))

    expect(response.status).toBe(401)
    expect(mockListReferralsForAdmin).not.toHaveBeenCalled()
  })

  it('lists pending referrals for admin with default pagination', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' })
    mockListReferralsForAdmin.mockResolvedValue({
      items: [
        {
          id: 'ref-1',
          status: 'PENDING',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          completedAt: null,
          referrer: { id: 'u1', email: 'u1@example.com', firstName: 'A', lastName: null },
          invitedUser: { id: 'u2', email: 'u2@example.com', firstName: 'B', lastName: null },
          redemptionCount: 1,
          eligible: true,
        },
      ],
      total: 1,
    })

    const response = await GET(getRequest('http://localhost/api/admin/referrals'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.referrals).toHaveLength(1)
    expect(body.referrals[0].status).toBe('PENDING')
    expect(body.referrals[0].eligible).toBe(true)
    expect(body.status).toBe('PENDING')
    expect(body.limit).toBe(50)
    expect(body.offset).toBe(0)
    expect(mockListReferralsForAdmin).toHaveBeenCalledWith({ status: 'PENDING', limit: 50, offset: 0 })
  })

  it('passes status query param when valid', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' })
    mockListReferralsForAdmin.mockResolvedValue({ items: [], total: 0 })

    const response = await GET(getRequest('http://localhost/api/admin/referrals?status=COMPLETED&limit=10&offset=20'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('COMPLETED')
    expect(mockListReferralsForAdmin).toHaveBeenCalledWith({ status: 'COMPLETED', limit: 10, offset: 20 })
  })

  it('falls back to PENDING when status is invalid', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' })
    mockListReferralsForAdmin.mockResolvedValue({ items: [], total: 0 })

    const response = await GET(getRequest('http://localhost/api/admin/referrals?status=INVALID'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('PENDING')
    expect(mockListReferralsForAdmin).toHaveBeenCalledWith({ status: 'PENDING', limit: 50, offset: 0 })
  })

  it('clamps limit between 1 and 100', async () => {
    mockGetSession.mockResolvedValue({ userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' })
    mockListReferralsForAdmin.mockResolvedValue({ items: [], total: 0 })

    const response = await GET(getRequest('http://localhost/api/admin/referrals?limit=0&offset=-5'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.limit).toBe(1)
    expect(body.offset).toBe(0)
  })
})
