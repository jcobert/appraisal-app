/**
 * @jest-environment node
 */
import {
  handleCreateOrder,
  handleGetOrder,
  handleGetOrders,
} from '../order-handlers'

import { db } from '@/lib/db/client'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode } from '@/utils/fetch'

import { SessionUser } from '@/types/auth'

jest.mock('../../client', () => ({
  db: {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    property: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('../../api-handlers', () => ({
  ...jest.requireActual('../../api-handlers'),
}))

jest.mock('@/utils/auth')

const mockDb = db as jest.Mocked<typeof db>
const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>

describe('order-handlers', () => {
  const mockUser: SessionUser = {
    id: 'user-123',
    email: 'test@example.com',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/avatar.jpg',
  }

  const organizationId = 'org-456'
  const orderId = 'order-789'

  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })
    ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-profile-123',
    })
  })

  // ===========================================================================
  // handleGetOrders
  // ===========================================================================
  describe('handleGetOrders', () => {
    it('should return orders scoped to organization', async () => {
      const mockOrders = [{ id: orderId, organizationId }]
      ;(mockDb.order.findMany as jest.Mock).mockResolvedValue(mockOrders)

      const result = await handleGetOrders(organizationId)

      expect(result).toEqual({ status: 200, data: mockOrders })
      expect(mockDb.order.findMany).toHaveBeenCalledWith({
        where: { organizationId },
        include: expect.objectContaining({
          property: expect.any(Object),
          client: expect.any(Object),
          appraiser: expect.any(Object),
        }),
      })
    })

    it('should return 400 when organizationId is empty', async () => {
      const result = await handleGetOrders('')

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Organization ID is required.',
          details: {},
        },
      })
    })

    it('should return 401 when user is not authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

      const result = await handleGetOrders(organizationId)

      expect(result).toEqual({
        status: 401,
        error: {
          code: FetchErrorCode.NOT_AUTHENTICATED,
          message: 'User not authenticated.',
        },
        data: null,
      })
    })
  })

  // ===========================================================================
  // handleGetOrder
  // ===========================================================================
  describe('handleGetOrder', () => {
    it('should return a single order scoped to organization', async () => {
      const mockOrder = { id: orderId, organizationId }
      ;(mockDb.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

      const result = await handleGetOrder(organizationId, orderId)

      expect(result).toEqual({ status: 200, data: mockOrder })
      expect(mockDb.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId, organizationId },
        include: expect.objectContaining({
          property: true,
          client: expect.any(Object),
          appraiser: expect.any(Object),
        }),
      })
    })

    it('should return 400 when organizationId is empty', async () => {
      const result = await handleGetOrder('', orderId)

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Organization ID is required.',
          details: {},
        },
      })
    })

    it('should return 400 when orderId is empty', async () => {
      const result = await handleGetOrder(organizationId, '')

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Order ID is required.',
          details: {},
        },
      })
    })
  })

  // ===========================================================================
  // handleCreateOrder
  // ===========================================================================
  describe('handleCreateOrder', () => {
    const validPayload = {
      clientId: null,
      appraiserId: null,
      borrowerId: null,
      propertyId: null,
      dueDate: null,
      orderDate: null,
      inspectionDate: null,
      appraisalType: null,
      orderStatus: 'open' as const,
      paymentStatus: 'unpaid' as const,
      fileNumber: null,
      clientOrderNum: null,
      baseFee: null,
      techFee: null,
      questionnaireFee: null,
      questionnaire: false,
      contract: false,
      sent: false,
      propertyType: 'singleFamily' as const,
      street: '123 Main St',
      street2: null,
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    }

    it('should create a new property with organizationId when no propertyId provided', async () => {
      ;(mockDb.property.create as jest.Mock).mockResolvedValue({
        id: 'new-property-id',
      })
      ;(mockDb.order.create as jest.Mock).mockResolvedValue({
        id: 'new-order-id',
      })

      await handleCreateOrder(organizationId, validPayload)

      // Verify property is created with organizationId
      expect(mockDb.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId,
          propertyType: 'singleFamily',
          street: '123 Main St',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          createdBy: 'user-profile-123',
          updatedBy: 'user-profile-123',
        }),
        select: { id: true },
      })
    })

    it('should include organizationId in the inline property create for tenant isolation', async () => {
      ;(mockDb.property.create as jest.Mock).mockResolvedValue({
        id: 'new-property-id',
      })
      ;(mockDb.order.create as jest.Mock).mockResolvedValue({
        id: 'new-order-id',
      })

      await handleCreateOrder(organizationId, validPayload)

      const propertyCreateCall = (mockDb.property.create as jest.Mock).mock
        .calls[0][0]
      expect(propertyCreateCall.data.organizationId).toBe(organizationId)
    })

    it('should not create a property when propertyId is provided', async () => {
      const payloadWithProperty = {
        ...validPayload,
        propertyId: 'existing-property-id',
      }
      ;(mockDb.order.create as jest.Mock).mockResolvedValue({
        id: 'new-order-id',
      })

      await handleCreateOrder(organizationId, payloadWithProperty)

      expect(mockDb.property.create).not.toHaveBeenCalled()
      expect(mockDb.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyId: 'existing-property-id',
          organizationId,
        }),
        select: { id: true },
      })
    })

    it('should create order with organizationId', async () => {
      ;(mockDb.property.create as jest.Mock).mockResolvedValue({
        id: 'new-property-id',
      })
      ;(mockDb.order.create as jest.Mock).mockResolvedValue({
        id: 'new-order-id',
      })

      const result = await handleCreateOrder(organizationId, validPayload)

      expect(result).toEqual({
        status: 200,
        data: { id: 'new-order-id' },
        message: 'Order created successfully',
      })
      expect(mockDb.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId,
          createdBy: 'user-profile-123',
          updatedBy: 'user-profile-123',
        }),
        select: { id: true },
      })
    })

    it('should return 400 when organizationId is empty', async () => {
      const result = await handleCreateOrder('', validPayload)

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Organization ID is required.',
          details: {},
        },
      })
      expect(mockDb.order.create).not.toHaveBeenCalled()
    })

    it('should return 401 when user is not authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

      const result = await handleCreateOrder(organizationId, validPayload)

      expect(result).toEqual({
        status: 401,
        error: {
          code: FetchErrorCode.NOT_AUTHENTICATED,
          message: 'User not authenticated.',
        },
        data: null,
      })
    })

    it('should return error when user profile not found', async () => {
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await handleCreateOrder(organizationId, validPayload)

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'No user profile found.',
          details: {},
        },
      })
      expect(mockDb.order.create).not.toHaveBeenCalled()
    })

    it('should handle database errors during order creation', async () => {
      ;(mockDb.property.create as jest.Mock).mockResolvedValue({
        id: 'new-property-id',
      })
      ;(mockDb.order.create as jest.Mock).mockRejectedValue(
        new Error('Foreign key constraint failed'),
      )

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleCreateOrder(organizationId, validPayload)

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Foreign key constraint failed',
        },
      })
      consoleSpy.mockRestore()
    })
  })
})
