/**
 * @jest-environment node
 */
import {
  handleCreateClient,
  handleGetClient,
  handleGetClients,
  handleUpdateClient,
} from '../client-handlers'

import { db } from '@/lib/db/client'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode } from '@/utils/fetch'

import { SessionUser } from '@/types/auth'

jest.mock('../../client', () => ({
  db: {
    client: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

describe('client-handlers', () => {
  const mockUser: SessionUser = {
    id: 'user-123',
    email: 'test@example.com',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/avatar.jpg',
  }

  const organizationId = 'org-456'
  const clientId = 'client-789'

  const mockClient = {
    id: clientId,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-profile-123',
    updatedBy: 'user-profile-123',
    organizationId,
    name: 'Test Client Inc',
    phone: '555-0100',
    email: 'test@client.com',
    street: '123 Main St',
    street2: null,
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    website: 'https://testclient.com',
    logo: null,
    pocFirstName: 'John',
    pocLastName: 'Doe',
    pocPhone: '555-0101',
    pocEmail: 'john@client.com',
    note: null,
    favorite: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })
    ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-profile-123',
    })
  })

  // ===========================================================================
  // handleGetClients
  // ===========================================================================
  describe('handleGetClients', () => {
    it('should return clients scoped to the organization', async () => {
      const clients = [
        { ...mockClient, _count: { Order: 3 } },
        {
          ...mockClient,
          id: 'client-2',
          name: 'Another Client',
          _count: { Order: 1 },
        },
      ]
      ;(mockDb.client.findMany as jest.Mock).mockResolvedValue(clients)

      const result = await handleGetClients(organizationId)

      expect(result).toEqual({ status: 200, data: clients })
      expect(mockDb.client.findMany).toHaveBeenCalledWith({
        where: { organizationId },
        include: { _count: { select: { Order: true } } },
      })
    })

    it('should query using direct organizationId, not indirect Order relation', async () => {
      ;(mockDb.client.findMany as jest.Mock).mockResolvedValue([])

      await handleGetClients(organizationId)

      const callArgs = (mockDb.client.findMany as jest.Mock).mock.calls[0][0]
      // Must use direct organizationId — NOT Order.some.organizationId
      expect(callArgs.where).toEqual({ organizationId })
      expect(callArgs.where).not.toHaveProperty('Order')
    })

    it('should return empty array when no clients exist', async () => {
      ;(mockDb.client.findMany as jest.Mock).mockResolvedValue([])

      const result = await handleGetClients(organizationId)

      expect(result).toEqual({ status: 200, data: [] })
    })

    it('should return 400 when organizationId is empty', async () => {
      const result = await handleGetClients('')

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Organization ID is required.',
          details: {},
        },
      })
      expect(mockDb.client.findMany).not.toHaveBeenCalled()
    })

    it('should return 401 when user is not authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

      const result = await handleGetClients(organizationId)

      expect(result).toEqual({
        status: 401,
        error: {
          code: FetchErrorCode.NOT_AUTHENTICATED,
          message: 'User not authenticated.',
        },
        data: null,
      })
    })

    it('should handle database errors', async () => {
      ;(mockDb.client.findMany as jest.Mock).mockRejectedValue(
        new Error('Connection refused'),
      )

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleGetClients(organizationId)

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Connection refused',
        },
      })
      consoleSpy.mockRestore()
    })
  })

  // ===========================================================================
  // handleGetClient
  // ===========================================================================
  describe('handleGetClient', () => {
    it('should return a single client scoped to organization', async () => {
      const clientWithCount = { ...mockClient, _count: { Order: 5 } }
      ;(mockDb.client.findFirst as jest.Mock).mockResolvedValue(clientWithCount)

      const result = await handleGetClient(organizationId, clientId)

      expect(result).toEqual({ status: 200, data: clientWithCount })
      expect(mockDb.client.findFirst).toHaveBeenCalledWith({
        where: { id: clientId, organizationId },
        include: { _count: { select: { Order: true } } },
      })
    })

    it('should filter by both clientId and organizationId for tenant isolation', async () => {
      ;(mockDb.client.findFirst as jest.Mock).mockResolvedValue(null)

      await handleGetClient(organizationId, clientId)

      const callArgs = (mockDb.client.findFirst as jest.Mock).mock.calls[0][0]
      expect(callArgs.where).toEqual({ id: clientId, organizationId })
      expect(callArgs.where).not.toHaveProperty('Order')
    })

    it('should return 404 when client not found in organization', async () => {
      ;(mockDb.client.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await handleGetClient(organizationId, clientId)

      expect(result).toEqual({
        status: 404,
        data: null,
        error: {
          code: FetchErrorCode.NOT_FOUND,
          message: 'The requested resource could not be found.',
        },
      })
    })

    it('should return 400 when organizationId is empty', async () => {
      const result = await handleGetClient('', clientId)

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

    it('should return 400 when clientId is empty', async () => {
      const result = await handleGetClient(organizationId, '')

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Client ID is required.',
          details: {},
        },
      })
    })

    it('should return 401 when user is not authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

      const result = await handleGetClient(organizationId, clientId)

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
  // handleCreateClient
  // ===========================================================================
  describe('handleCreateClient', () => {
    const validPayload = {
      name: 'New Client Corp',
      phone: '555-0200',
      email: 'new@client.com',
      street: '456 Oak Ave',
      street2: null,
      city: 'Denver',
      state: 'CO',
      zip: '80201',
      website: null,
      logo: null,
      pocFirstName: null,
      pocLastName: null,
      pocPhone: null,
      pocEmail: null,
      note: null,
      favorite: false,
    }

    it('should create a client with organizationId', async () => {
      ;(mockDb.client.create as jest.Mock).mockResolvedValue({
        id: 'new-client-id',
      })

      const result = await handleCreateClient(organizationId, validPayload)

      expect(result).toEqual({
        status: 200,
        data: { id: 'new-client-id' },
        message: 'Client created successfully',
      })
      expect(mockDb.client.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId,
          createdBy: 'user-profile-123',
          updatedBy: 'user-profile-123',
        }),
        select: { id: true },
      })
    })

    it('should include organizationId in create data for proper scoping', async () => {
      ;(mockDb.client.create as jest.Mock).mockResolvedValue({
        id: 'new-client-id',
      })

      await handleCreateClient(organizationId, validPayload)

      const createCall = (mockDb.client.create as jest.Mock).mock.calls[0][0]
      expect(createCall.data.organizationId).toBe(organizationId)
    })

    it('should return 400 when organizationId is empty', async () => {
      const result = await handleCreateClient('', validPayload)

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Organization ID is required.',
          details: {},
        },
      })
      expect(mockDb.client.create).not.toHaveBeenCalled()
    })

    it('should return 400 when payload is invalid', async () => {
      const invalidPayload = {
        name: '', // name is required but empty string may be invalid
        email: 'not-an-email',
      }

      const result = await handleCreateClient(
        organizationId,
        invalidPayload as any,
      )

      expect(result.status).toBe(400)
      expect(result.data).toBeNull()
      expect(mockDb.client.create).not.toHaveBeenCalled()
    })

    it('should return 401 when user is not authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

      const result = await handleCreateClient(organizationId, validPayload)

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

      const result = await handleCreateClient(organizationId, validPayload)

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'No user profile found.',
          details: {},
        },
      })
      expect(mockDb.client.create).not.toHaveBeenCalled()
    })

    it('should handle database errors during create', async () => {
      ;(mockDb.client.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint violation'),
      )

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleCreateClient(organizationId, validPayload)

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Unique constraint violation',
        },
      })
      consoleSpy.mockRestore()
    })
  })

  // ===========================================================================
  // handleUpdateClient
  // ===========================================================================
  describe('handleUpdateClient', () => {
    const updatePayload = {
      name: 'Updated Client Name',
      phone: '555-0300',
    }

    it('should update a client when it belongs to the organization', async () => {
      ;(mockDb.client.findFirst as jest.Mock).mockResolvedValue(mockClient)
      ;(mockDb.client.update as jest.Mock).mockResolvedValue({ id: clientId })

      const result = await handleUpdateClient(
        organizationId,
        clientId,
        updatePayload,
      )

      expect(result).toEqual({
        status: 200,
        data: { id: clientId },
        message: 'Client updated successfully',
      })
    })

    it('should verify client belongs to organization using direct organizationId', async () => {
      ;(mockDb.client.findFirst as jest.Mock).mockResolvedValue(mockClient)
      ;(mockDb.client.update as jest.Mock).mockResolvedValue({ id: clientId })

      await handleUpdateClient(organizationId, clientId, updatePayload)

      expect(mockDb.client.findFirst).toHaveBeenCalledWith({
        where: { id: clientId, organizationId },
      })
    })

    it('should return 400 when client not found in organization (cross-org isolation)', async () => {
      ;(mockDb.client.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await handleUpdateClient(
        organizationId,
        clientId,
        updatePayload,
      )

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Client not found or does not belong to this organization.',
          details: {},
        },
      })
      expect(mockDb.client.update).not.toHaveBeenCalled()
    })

    it('should prevent updating a client from another organization', async () => {
      // Client exists but belongs to a different org — findFirst returns null
      ;(mockDb.client.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await handleUpdateClient(
        'other-org-id',
        clientId,
        updatePayload,
      )

      expect(result.data).toBeNull()
      expect(mockDb.client.update).not.toHaveBeenCalled()
    })

    it('should return 400 when organizationId is empty', async () => {
      const result = await handleUpdateClient('', clientId, updatePayload)

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

    it('should return 400 when clientId is empty', async () => {
      const result = await handleUpdateClient(organizationId, '', updatePayload)

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Client ID is required.',
          details: {},
        },
      })
    })

    it('should return 401 when user is not authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

      const result = await handleUpdateClient(
        organizationId,
        clientId,
        updatePayload,
      )

      expect(result).toEqual({
        status: 401,
        error: {
          code: FetchErrorCode.NOT_AUTHENTICATED,
          message: 'User not authenticated.',
        },
        data: null,
      })
    })

    it('should handle database errors during update', async () => {
      ;(mockDb.client.findFirst as jest.Mock).mockResolvedValue(mockClient)
      ;(mockDb.client.update as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      )

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleUpdateClient(
        organizationId,
        clientId,
        updatePayload,
      )

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Database error',
        },
      })
      consoleSpy.mockRestore()
    })
  })
})
