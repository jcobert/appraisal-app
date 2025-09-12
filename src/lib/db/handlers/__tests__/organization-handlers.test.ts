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
import { ZodIssueCode } from 'zod'

import { userIsMember, userIsOwner } from '@/lib/db/queries/organization'
import { getUserPermissions } from '@/lib/db/utils'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode } from '@/utils/fetch'
import { validatePayload } from '@/utils/zod'

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
jest.mock('@/utils/auth')
jest.mock('@/lib/db/queries/organization')
jest.mock('@/lib/db/utils')
jest.mock('@/utils/zod')

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
const mockValidatePayload = validatePayload as jest.MockedFunction<
  typeof validatePayload
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
    mockValidatePayload.mockReturnValue({
      success: true,
      data: {},
      errors: null,
    })

    // Default to user being a member for authorization checks
    mockUserIsMember.mockResolvedValue(true)

    // Default mock for getUserPermissions
    mockGetUserPermissions.mockResolvedValue({
      organization: [],
      orders: [],
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
            },
          },
        },
      })
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
      // Mock database to throw error for empty ID
      const dbError = new Error('Invalid ID')
      ;(mockDb.organization.findUnique as jest.Mock).mockRejectedValue(dbError)

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleGetOrganization('')

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Invalid ID',
        },
      })

      consoleSpy.mockRestore()
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
      expect(mockValidatePayload).toHaveBeenCalled()
      expect(mockDb.organization.update).toHaveBeenCalledWith({
        where: { id: organizationId },
        data: expect.objectContaining({
          ...payload,
          updatedBy: mockUser.id,
        }),
      })
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
      const validationErrors = {
        name: { code: ZodIssueCode.too_small, message: 'Name is too short' },
      }
      mockValidatePayload.mockReturnValue({
        success: false,
        data: null,
        errors: validationErrors,
      })
      mockUserIsOwner.mockResolvedValue(true)

      const result = await handleUpdateOrganization(organizationId, payload)

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Invalid data provided.',
          details: validationErrors,
        },
      })
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
      expect(mockValidatePayload).toHaveBeenCalled()
      expect(mockDb.organization.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...payload,
          createdBy: mockUser.id,
          updatedBy: mockUser.id,
          members: {
            create: expect.objectContaining({
              userId: 'user-profile-123',
              roles: ['owner'],
              createdBy: mockUser.id,
              updatedBy: mockUser.id,
            }),
          },
        }),
        select: { id: true, name: true },
      })
    })

    it('should return 400 when validation fails', async () => {
      const validationErrors = {
        name: { code: ZodIssueCode.too_small, message: 'Name is required' },
      }
      mockValidatePayload.mockReturnValue({
        success: false,
        data: null,
        errors: validationErrors,
      })

      const result = await handleCreateOrganization(payload)

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Invalid data provided.',
          details: validationErrors,
        },
      })
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
      // getUserPermissions will return empty permissions on error due to try-catch
      const result = await handleGetOrganizationPermissions('')

      expect(result.status).toBe(200)
      expect(result.data).toEqual({
        organization: [],
        orders: [],
      })
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
