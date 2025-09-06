/**
 * @jest-environment node
 */
import {
  handleCreateOrganization,
  handleDeleteOrganization,
  handleGetOrganization,
  handleGetOrganizationPermissions,
  handleGetUserOrganizations,
  handleUpdateOrganization,
} from '../organization-handlers'
import type { KindeUser } from '@kinde-oss/kinde-auth-nextjs/types'
import { ZodIssueCode } from 'zod'

import {
  createOrganization,
  deleteOrganization,
  getOrganization,
  getUserOrganizations,
  updateOrganization,
  userIsOwner,
} from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'
import { getUserPermissions } from '@/lib/db/utils'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode } from '@/utils/fetch'
import { validatePayload } from '@/utils/zod'

// Mock dependencies
jest.mock('@/utils/auth', () => ({
  isAuthenticated: jest.fn(),
}))

jest.mock('@/lib/db/queries/organization', () => ({
  getUserOrganizations: jest.fn(),
  getOrganization: jest.fn(),
  updateOrganization: jest.fn(),
  deleteOrganization: jest.fn(),
  createOrganization: jest.fn(),
  userIsOwner: jest.fn(),
}))

jest.mock('@/lib/db/queries/user', () => ({
  getActiveUserProfile: jest.fn(),
}))

jest.mock('@/lib/db/utils', () => ({
  getUserPermissions: jest.fn(),
}))

jest.mock('@/utils/zod', () => ({
  validatePayload: jest.fn(),
}))

const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>
const mockGetUserOrganizations = getUserOrganizations as jest.MockedFunction<
  typeof getUserOrganizations
>
const mockGetOrganization = getOrganization as jest.MockedFunction<
  typeof getOrganization
>
const mockUpdateOrganization = updateOrganization as jest.MockedFunction<
  typeof updateOrganization
>
const mockDeleteOrganization = deleteOrganization as jest.MockedFunction<
  typeof deleteOrganization
>
const mockCreateOrganization = createOrganization as jest.MockedFunction<
  typeof createOrganization
>
const mockUserIsOwner = userIsOwner as jest.MockedFunction<typeof userIsOwner>
const mockGetActiveUserProfile = getActiveUserProfile as jest.MockedFunction<
  typeof getActiveUserProfile
>
const mockGetUserPermissions = getUserPermissions as jest.MockedFunction<
  typeof getUserPermissions
>
const mockValidatePayload = validatePayload as jest.MockedFunction<
  typeof validatePayload
>

describe('organization-handlers', () => {
  const mockUser: KindeUser<Record<string, any>> = {
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
    mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })
    mockValidatePayload.mockReturnValue({
      success: true,
      data: {},
      errors: null,
    })
  })

  describe('handleGetUserOrganizations', () => {
    it('should return organizations for authenticated user', async () => {
      const organizations = [mockOrganization]
      mockGetUserOrganizations.mockResolvedValue(organizations)

      const result = await handleGetUserOrganizations()

      expect(result).toEqual({
        status: 200,
        data: organizations,
      })
      expect(mockGetUserOrganizations).toHaveBeenCalled()
    })

    it('should return empty array when no organizations found', async () => {
      mockGetUserOrganizations.mockResolvedValue(null)

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
      mockGetUserOrganizations.mockRejectedValue(error)

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
      mockGetOrganization.mockResolvedValue(mockOrganizationWithMembers)

      const result = await handleGetOrganization(organizationId)

      expect(result).toEqual({
        status: 200,
        data: mockOrganizationWithMembers,
      })
      expect(mockGetOrganization).toHaveBeenCalledWith({ organizationId })
    })

    it('should return 404 when organization not found', async () => {
      mockGetOrganization.mockResolvedValue(null)

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
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleGetOrganization('')

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Organization ID is required',
        },
      })

      consoleSpy.mockRestore()
    })

    it('should handle database errors', async () => {
      const error = new Error('Database error')
      mockGetOrganization.mockRejectedValue(error)

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
      mockUpdateOrganization.mockResolvedValue(updatedOrganization)

      const result = await handleUpdateOrganization(organizationId, payload)

      expect(result).toEqual({
        status: 200,
        data: updatedOrganization,
        message: 'Organization updated successfully.',
      })
      expect(mockValidatePayload).toHaveBeenCalled()
      expect(mockUpdateOrganization).toHaveBeenCalledWith({
        organizationId,
        payload: expect.objectContaining({
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
      expect(mockUpdateOrganization).not.toHaveBeenCalled()
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
      mockDeleteOrganization.mockResolvedValue(mockOrganization)

      const result = await handleDeleteOrganization(organizationId)

      expect(result).toEqual({
        status: 200,
        data: mockOrganization,
        message: 'Organization deleted successfully.',
      })
      expect(mockDeleteOrganization).toHaveBeenCalledWith({ organizationId })
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
      mockGetActiveUserProfile.mockResolvedValue({
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
      mockGetUserOrganizations.mockResolvedValue([]) // No existing orgs
      mockCreateOrganization.mockResolvedValue(createdOrganization)

      const result = await handleCreateOrganization(payload)

      expect(result).toEqual({
        status: 200,
        data: createdOrganization,
        message: 'Organization created successfully.',
      })
      expect(mockValidatePayload).toHaveBeenCalled()
      expect(mockCreateOrganization).toHaveBeenCalledWith({
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
      mockGetActiveUserProfile.mockResolvedValue(null)

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
      mockGetUserOrganizations.mockResolvedValue([
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
      mockGetUserOrganizations.mockResolvedValue([]) // No existing orgs
      mockCreateOrganization.mockRejectedValue(error)

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

    it('should return 500 when organization ID is missing', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleGetOrganizationPermissions('')

      expect(result).toEqual({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Organization ID is required',
        },
      })

      consoleSpy.mockRestore()
    })

    it('should handle database errors', async () => {
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
