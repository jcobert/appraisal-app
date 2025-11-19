/**
 * @jest-environment node
 */
import { db } from '../../client'
import {
  handleCreateOrganization,
  handleDeleteOrganization,
  handleGetOrganization,
  handleGetOrganizationPermissions,
  handleGetUserOrganizations,
  handleUpdateOrganization,
} from '../organization-handlers'

import { userIsMember, userIsOwner } from '@/lib/db/queries/organization'
import { getUserPermissions } from '@/lib/db/utils'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode } from '@/utils/fetch'

import { SessionUser } from '@/types/auth'

jest.mock('../../client', () => ({
  db: {
    organization: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock the api-handlers module
jest.mock('../../api-handlers', () => ({
  ...jest.requireActual('../../api-handlers'),
}))

jest.mock('@/utils/auth')
jest.mock('@/lib/db/queries/organization')
jest.mock('@/lib/db/utils')

// Typed mocks
const mockDb = db as jest.Mocked<typeof db>
const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>
const mockUserIsOwner = userIsOwner as jest.MockedFunction<typeof userIsOwner>
const mockUserIsMember = userIsMember as jest.MockedFunction<
  typeof userIsMember
>
const mockGetUserPermissions = getUserPermissions as jest.MockedFunction<
  typeof getUserPermissions
>

describe('organization-handlers', () => {
  const mockUser: SessionUser = {
    id: 'user-123',
    email: 'test@example.com',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/avatar.jpg',
  }

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    description: 'A test organization',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    updatedBy: 'user-123',
    avatar: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default successful mocks
    mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })

    // Default to user being a member for authorization checks
    mockUserIsMember.mockResolvedValue(true)

    // Default mock for getUserPermissions
    mockGetUserPermissions.mockResolvedValue({
      organization: [],
      orders: [],
    })

    // Default mock for user profile ID lookup - ensure createApiHandler can resolve profile ID
    ;(mockDb.user.findUnique as jest.Mock).mockImplementation((query) => {
      // If this is the profile ID lookup query (by accountId)
      if (query.where?.accountId) {
        return Promise.resolve({ id: 'user-profile-123' })
      }
      // For handleCreateOrganization, also return user profile for organization owner lookup
      if (query.where?.accountId === 'user-123') {
        return Promise.resolve({ id: 'user-profile-123' })
      }
      // Otherwise return user profile for other queries
      return Promise.resolve({ id: 'user-profile-123' })
    })
  })

  describe('handleGetUserOrganizations', () => {
    it('should return organizations for authenticated user', async () => {
      const organizations = [mockOrganization]
      ;(mockDb.organization.findMany as jest.Mock).mockResolvedValue(
        organizations,
      )

      const result = await handleGetUserOrganizations()

      expect(result).toEqual({
        status: 200,
        data: organizations,
      })
      expect(mockDb.organization.findMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: {
              user: { accountId: mockUser.id },
              active: true,
            },
          },
        },
      })
    })

    it('should only return organizations with active memberships', async () => {
      const organizations = [mockOrganization]
      ;(mockDb.organization.findMany as jest.Mock).mockResolvedValue(
        organizations,
      )

      await handleGetUserOrganizations()

      // Verify that the query filters for active members only
      expect(mockDb.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            members: {
              some: expect.objectContaining({
                active: true,
              }),
            },
          },
        }),
      )
    })

    it('should return empty array when no organizations found', async () => {
      ;(mockDb.organization.findMany as jest.Mock).mockResolvedValue(null)

      const result = await handleGetUserOrganizations()

      expect(result).toEqual({
        status: 200,
        data: [],
      })
    })

    it('should return 401 when user is not authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

      const result = await handleGetUserOrganizations()

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
      const error = new Error('Database connection failed')
      ;(mockDb.organization.findMany as jest.Mock).mockRejectedValue(error)

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleGetUserOrganizations()

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Database connection failed',
        },
      })

      consoleSpy.mockRestore()
    })
  })

  describe('handleGetOrganization', () => {
    const organizationId = 'org-123'

    it('should return organization when found', async () => {
      const mockOrganizationWithMembers = {
        ...mockOrganization,
        members: [],
        invitations: [],
      }
      ;(mockDb.organization.findUnique as jest.Mock).mockResolvedValue(
        mockOrganizationWithMembers,
      )

      const result = await handleGetOrganization(organizationId)

      expect(result).toEqual({
        status: 200,
        data: mockOrganizationWithMembers,
      })
      expect(mockDb.organization.findUnique).toHaveBeenCalledWith({
        where: { id: organizationId },
        include: {
          members: {
            where: { active: true },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  email: true,
                },
              },
            },
            omit: { createdBy: true, updatedBy: true },
          },
          invitations: {
            where: { status: { in: ['expired', 'pending'] } },
            select: {
              id: true,
              status: true,
              expires: true,
              inviteeFirstName: true,
              inviteeLastName: true,
              inviteeEmail: true,
              roles: true,
              organizationId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        omit: { createdBy: true, updatedBy: true },
      })
    })

    it('should return 404 when organization not found', async () => {
      ;(mockDb.organization.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await handleGetOrganization(organizationId)

      expect(result).toEqual({
        status: 404,
        data: null,
        error: {
          code: FetchErrorCode.NOT_FOUND,
          message: 'The requested resource could not be found.',
        },
      })
    })

    it('should return 500 when organization ID is missing', async () => {
      const result = await handleGetOrganization('')

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

    it('should handle database errors', async () => {
      const error = new Error('Database error')
      ;(mockDb.organization.findUnique as jest.Mock).mockRejectedValue(error)

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleGetOrganization(organizationId)

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

  describe('handleUpdateOrganization', () => {
    const organizationId = 'org-123'
    const payload = {
      name: 'Updated Organization',
      description: 'Updated description',
    }

    it('should update organization when user is owner', async () => {
      const updatedOrganization = { ...mockOrganization, ...payload }
      mockUserIsOwner.mockResolvedValue(true)
      ;(mockDb.organization.update as jest.Mock).mockResolvedValue(
        updatedOrganization,
      )

      const result = await handleUpdateOrganization(organizationId, payload)

      expect(result).toEqual({
        status: 200,
        data: updatedOrganization,
        message: 'Organization updated successfully.',
      })
      expect(mockDb.organization.update).toHaveBeenCalledWith({
        where: { id: organizationId },
        data: {
          // Real validation with passthrough: sanitizes schema fields + preserves extra fields
          name: payload.name, // Schema field - validated and sanitized
          description: payload.description, // Extra field - preserved by passthrough
          // System-added audit field
          updatedBy: 'user-profile-123', // Now uses profile ID
        },
        select: { id: true, name: true },
      })
    })

    it('should accept partial payload (any subset of fields)', async () => {
      // Only updating name, not description
      const partialPayload = { name: 'New Name Only' }
      const updatedOrganization = { ...mockOrganization, ...partialPayload }
      mockUserIsOwner.mockResolvedValue(true)
      ;(mockDb.organization.update as jest.Mock).mockResolvedValue(
        updatedOrganization,
      )

      const result = await handleUpdateOrganization(
        organizationId,
        partialPayload,
      )

      expect(result).toEqual({
        status: 200,
        data: updatedOrganization,
        message: 'Organization updated successfully.',
      })
      expect(mockDb.organization.update).toHaveBeenCalledWith({
        where: { id: organizationId },
        data: {
          name: partialPayload.name,
          updatedBy: 'user-profile-123',
        },
        select: { id: true, name: true },
      })
    })

    it('should validate payload with partial schema (fields are optional)', async () => {
      // Empty payload should be valid with partial schema
      const emptyPayload = {}
      mockUserIsOwner.mockResolvedValue(true)
      ;(mockDb.organization.update as jest.Mock).mockResolvedValue(
        mockOrganization,
      )

      const result = await handleUpdateOrganization(
        organizationId,
        emptyPayload,
      )

      // Should succeed because partial schema makes all fields optional
      expect(result.status).toBe(200)
      expect(mockDb.organization.update).toHaveBeenCalledWith({
        where: { id: organizationId },
        data: {
          updatedBy: 'user-profile-123',
        },
        select: { id: true, name: true },
      })
    })

    it('should strip system fields from payload before updating', async () => {
      // Payload includes system fields that should be removed
      const payloadWithSystemFields = {
        name: 'Updated Name',
        id: 'malicious-id',
        createdAt: new Date(),
        createdBy: 'malicious-user',
        updatedAt: new Date(),
        updatedBy: 'malicious-user',
      }
      mockUserIsOwner.mockResolvedValue(true)
      ;(mockDb.organization.update as jest.Mock).mockResolvedValue(
        mockOrganization,
      )

      await handleUpdateOrganization(organizationId, payloadWithSystemFields)

      // Verify system fields were stripped and updatedBy was set correctly
      expect(mockDb.organization.update).toHaveBeenCalledWith({
        where: { id: organizationId },
        data: {
          name: 'Updated Name',
          updatedBy: 'user-profile-123', // Set by withUserFields, not from payload
        },
        select: { id: true, name: true },
      })
    })

    it('should preserve extra fields with passthrough option', async () => {
      // Payload includes extra fields not in the schema
      const payloadWithExtraFields = {
        name: 'Updated Name',
        customField: 'custom value',
        anotherField: 123,
      }
      mockUserIsOwner.mockResolvedValue(true)
      ;(mockDb.organization.update as jest.Mock).mockResolvedValue(
        mockOrganization,
      )

      await handleUpdateOrganization(organizationId, payloadWithExtraFields)

      // Verify extra fields are preserved by passthrough
      expect(mockDb.organization.update).toHaveBeenCalledWith({
        where: { id: organizationId },
        data: {
          name: 'Updated Name',
          customField: 'custom value',
          anotherField: 123,
          updatedBy: 'user-profile-123',
        },
        select: { id: true, name: true },
      })
    })

    it('should return 400 when organizationId is missing', async () => {
      mockUserIsOwner.mockResolvedValue(true)

      const result = await handleUpdateOrganization('', payload)

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Organization ID is required.',
          details: {},
        },
      })
      expect(mockDb.organization.update).not.toHaveBeenCalled()
    })

    it('should return 403 when user is not owner', async () => {
      mockUserIsOwner.mockResolvedValue(false)

      const result = await handleUpdateOrganization(organizationId, payload)

      expect(result).toEqual({
        status: 403,
        data: null,
        error: {
          code: FetchErrorCode.NOT_AUTHORIZED,
          message: 'Unauthorized to update this organization.',
        },
      })
      expect(mockDb.organization.update).not.toHaveBeenCalled()
    })

    it('should return 400 when validation fails', async () => {
      const invalidPayload = {
        name: '', // Empty name should fail validation
        description: 'Some description',
      }
      mockUserIsOwner.mockResolvedValue(true)

      const result = await handleUpdateOrganization(
        organizationId,
        invalidPayload,
      )

      expect(result.status).toBe(400)
      expect(result.error?.code).toBe(FetchErrorCode.INVALID_DATA)
      expect(result.error?.message).toBe('Invalid data provided.')
      expect(result.error?.details).toBeTruthy()
    })

    it('should return 500 when authorization check fails', async () => {
      mockUserIsOwner.mockRejectedValue(new Error('Database error'))

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleUpdateOrganization(organizationId, payload)

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Authorization check failed.',
        },
      })

      consoleSpy.mockRestore()
    })
  })

  describe('handleDeleteOrganization', () => {
    const organizationId = 'org-123'

    it('should delete organization when user is owner', async () => {
      mockUserIsOwner.mockResolvedValue(true)
      ;(mockDb.organization.delete as jest.Mock).mockResolvedValue(
        mockOrganization,
      )

      const result = await handleDeleteOrganization(organizationId)

      expect(result).toEqual({
        status: 200,
        data: mockOrganization,
        message: 'Organization deleted successfully.',
      })
      expect(mockDb.organization.delete).toHaveBeenCalledWith({
        where: { id: organizationId },
        select: { name: true },
      })
    })

    it('should return 403 when user is not owner', async () => {
      mockUserIsOwner.mockResolvedValue(false)

      const result = await handleDeleteOrganization(organizationId)

      expect(result).toEqual({
        status: 403,
        data: null,
        error: {
          code: FetchErrorCode.NOT_AUTHORIZED,
          message: 'Unauthorized to delete this organization.',
        },
      })
    })

    it('should return 500 when authorization check fails', async () => {
      mockUserIsOwner.mockRejectedValue(new Error('Database error'))

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleDeleteOrganization(organizationId)

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Authorization check failed.',
        },
      })

      consoleSpy.mockRestore()
    })
  })

  describe('handleCreateOrganization', () => {
    const payload = { name: 'New Organization', description: 'New description' }

    beforeEach(() => {
      // Make sure the user profile is available for create tests
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-profile-123',
        accountId: mockUser.id,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: null,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      })
    })

    it('should create organization with valid payload', async () => {
      const createdOrganization = { ...mockOrganization, ...payload }
      ;(mockDb.organization.findMany as jest.Mock).mockResolvedValue([]) // No existing orgs
      ;(mockDb.organization.create as jest.Mock).mockResolvedValue(
        createdOrganization,
      )

      const result = await handleCreateOrganization(payload)

      expect(result).toEqual({
        status: 200,
        data: createdOrganization,
        message: 'Organization created successfully.',
      })
      expect(mockDb.organization.create).toHaveBeenCalledWith({
        data: {
          // Real validation with passthrough: sanitizes schema fields + preserves extra fields
          name: payload.name, // Schema field - validated and sanitized
          description: payload.description, // Extra field - preserved by passthrough
          // System-added fields
          createdBy: 'user-profile-123', // Now uses profile ID
          updatedBy: 'user-profile-123', // Now uses profile ID
          members: {
            create: {
              userId: 'user-profile-123',
              isOwner: true,
              roles: [],
              createdBy: 'user-profile-123', // Now uses profile ID
              updatedBy: 'user-profile-123', // Now uses profile ID
            },
          },
        },
        select: { id: true, name: true },
      })
    })

    it('should return 400 when validation fails', async () => {
      const invalidPayload = {
        name: '', // Empty name should fail validation
        description: 'Some description',
      }

      const result = await handleCreateOrganization(invalidPayload)

      expect(result.status).toBe(400)
      expect(result.error?.code).toBe(FetchErrorCode.INVALID_DATA)
      expect(result.error?.message).toBe('Invalid data provided.')
      expect(result.error?.details).toBeTruthy()
    })

    it('should return 400 when user profile not found', async () => {
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await handleCreateOrganization(payload)

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'No user profile found.',
          details: {},
        },
      })
    })

    it('should return 400 when organization name already exists', async () => {
      ;(mockDb.organization.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'existing-org',
          name: payload.name,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-123',
          updatedBy: 'user-123',
          avatar: null,
        },
      ])

      const result = await handleCreateOrganization(payload)

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'An organization with this name already exists.',
          details: {},
        },
      })
    })

    it('should handle database errors', async () => {
      const error = new Error('Failed to create organization')
      ;(mockDb.organization.findMany as jest.Mock).mockResolvedValue([]) // No existing orgs
      ;(mockDb.organization.create as jest.Mock).mockRejectedValue(error)

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleCreateOrganization(payload)

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Failed to create organization',
        },
      })

      consoleSpy.mockRestore()
    })
  })

  describe('handleGetOrganizationPermissions', () => {
    const organizationId = 'org-123'

    it('should return permissions for valid organization', async () => {
      const permissions = {
        organization: ['view_org', 'edit_org_info'] as (
          | 'view_org'
          | 'edit_org_info'
          | 'edit_org_members'
          | 'delete_org'
          | 'view_org_member_details'
        )[],
        orders: ['view_orders', 'create_order'] as (
          | 'create_order'
          | 'edit_order'
          | 'delete_order'
          | 'view_orders'
        )[],
      }
      mockGetUserPermissions.mockResolvedValue(permissions)

      const result = await handleGetOrganizationPermissions(organizationId)

      expect(result).toEqual({
        status: 200,
        data: permissions,
      })
      expect(mockGetUserPermissions).toHaveBeenCalledWith(organizationId)
    })

    it('should return empty permissions when organization ID is missing', async () => {
      const result = await handleGetOrganizationPermissions('')

      expect(result.status).toBe(400)
      expect(result.error?.code).toBe(FetchErrorCode.INVALID_DATA)
      expect(result.error?.message).toBe('Organization ID is required.')
    })

    it('should handle database errors', async () => {
      const organizationId = 'org-123'
      const error = new Error('Failed to get permissions')
      mockGetUserPermissions.mockRejectedValue(error)

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleGetOrganizationPermissions(organizationId)

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Failed to get permissions',
        },
      })

      consoleSpy.mockRestore()
    })
  })
})
