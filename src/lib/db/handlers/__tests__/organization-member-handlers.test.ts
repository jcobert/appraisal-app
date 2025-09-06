/**
 * @jest-environment node
 */
import {
  handleDeleteOrgMember,
  handleGetActiveUserOrgMember,
  handleGetOrgMember,
  handleUpdateActiveUserOrgMember,
  handleUpdateOrgMember,
} from '../organization-member-handlers'
import type { KindeUser } from '@kinde-oss/kinde-auth-nextjs/types'
import { MemberRole } from '@prisma/client'
import { ZodIssueCode } from 'zod'

import {
  deleteOrgMember,
  getActiveUserOrgMember,
  getOrgMember,
  updateOrgMember,
  userIsMember,
  userIsOwner,
} from '@/lib/db/queries/organization'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode } from '@/utils/fetch'
import { validatePayload } from '@/utils/zod'

// Mock dependencies
jest.mock('@/utils/auth', () => ({
  isAuthenticated: jest.fn(),
}))

jest.mock('@/lib/db/queries/organization', () => ({
  getOrgMember: jest.fn(),
  getActiveUserOrgMember: jest.fn(),
  updateOrgMember: jest.fn(),
  deleteOrgMember: jest.fn(),
  userIsOwner: jest.fn(),
  userIsMember: jest.fn(),
}))

jest.mock('@/utils/zod', () => ({
  validatePayload: jest.fn(),
}))

const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>
const mockGetOrgMember = getOrgMember as jest.MockedFunction<
  typeof getOrgMember
>
const mockGetActiveUserOrgMember =
  getActiveUserOrgMember as jest.MockedFunction<typeof getActiveUserOrgMember>
const mockUpdateOrgMember = updateOrgMember as jest.MockedFunction<
  typeof updateOrgMember
>
const mockDeleteOrgMember = deleteOrgMember as jest.MockedFunction<
  typeof deleteOrgMember
>
const mockUserIsOwner = userIsOwner as jest.MockedFunction<typeof userIsOwner>
const mockUserIsMember = userIsMember as jest.MockedFunction<
  typeof userIsMember
>
const mockValidatePayload = validatePayload as jest.MockedFunction<
  typeof validatePayload
>

describe('organization-member-handlers', () => {
  const mockUser: KindeUser<Record<string, any>> = {
    id: 'user-123',
    email: 'test@example.com',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/avatar.jpg',
  }

  const mockOrgMember = {
    id: 'member-123',
    organizationId: 'org-123',
    userId: 'user-profile-123',
    roles: [MemberRole.appraiser],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    updatedBy: 'user-123',
    user: {
      id: 'user-profile-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      accountId: 'user-123',
      phone: null,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
    },
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

  describe('handleGetOrgMember', () => {
    const organizationId = 'org-123'
    const memberId = 'member-456'

    it('should return organization member when found', async () => {
      mockGetOrgMember.mockResolvedValue(mockOrgMember)

      const result = await handleGetOrgMember(organizationId, memberId)

      expect(result).toEqual({
        status: 200,
        data: mockOrgMember,
      })
      expect(mockGetOrgMember).toHaveBeenCalledWith({
        organizationId,
        memberId,
      })
    })

    it('should return 404 when member not found', async () => {
      mockGetOrgMember.mockResolvedValue(null)

      const result = await handleGetOrgMember(organizationId, memberId)

      expect(result).toEqual({
        status: 404,
        data: null,
        error: {
          code: FetchErrorCode.NOT_FOUND,
          message: 'The requested resource could not be found.',
        },
      })
    })

    it('should handle database errors', async () => {
      const error = new Error('Database error')
      mockGetOrgMember.mockRejectedValue(error)

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleGetOrgMember(organizationId, memberId)

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

  describe('handleGetActiveUserOrgMember', () => {
    const organizationId = 'org-123'

    it('should return active user organization member when found', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue(mockOrgMember)

      const result = await handleGetActiveUserOrgMember(organizationId)

      expect(result).toEqual({
        status: 200,
        data: mockOrgMember,
      })
      expect(mockGetActiveUserOrgMember).toHaveBeenCalledWith({
        organizationId,
      })
    })

    it('should return 404 when member not found', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue(null)

      const result = await handleGetActiveUserOrgMember(organizationId)

      expect(result).toEqual({
        status: 404,
        data: null,
        error: {
          code: FetchErrorCode.NOT_FOUND,
          message: 'The requested resource could not be found.',
        },
      })
    })

    it('should handle database errors', async () => {
      const error = new Error('Database error')
      mockGetActiveUserOrgMember.mockRejectedValue(error)

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleGetActiveUserOrgMember(organizationId)

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

  describe('handleUpdateOrgMember', () => {
    const organizationId = 'org-123'
    const memberId = 'member-456'
    const payload = { roles: [MemberRole.manager] }

    it('should update organization member when user is owner', async () => {
      const updatedMember = { ...mockOrgMember, ...payload }
      mockUserIsOwner.mockResolvedValue(true)
      mockUpdateOrgMember.mockResolvedValue(updatedMember)

      const result = await handleUpdateOrgMember(
        organizationId,
        memberId,
        payload,
      )

      expect(result).toEqual({
        status: 200,
        data: updatedMember,
        message: 'Member updated successfully.',
      })
      expect(mockValidatePayload).toHaveBeenCalled()
      expect(mockUpdateOrgMember).toHaveBeenCalledWith({
        organizationId,
        memberId,
        payload: expect.objectContaining({
          ...payload,
          updatedBy: mockUser.id,
        }),
      })
    })

    it('should return 403 when user is not owner', async () => {
      mockUserIsOwner.mockResolvedValue(false)

      const result = await handleUpdateOrgMember(
        organizationId,
        memberId,
        payload,
      )

      expect(result).toEqual({
        status: 403,
        data: null,
        error: {
          code: FetchErrorCode.AUTH,
          message: 'Unauthorized to update organization members.',
        },
      })
      expect(mockUpdateOrgMember).not.toHaveBeenCalled()
    })

    it('should return 400 when validation fails', async () => {
      const validationErrors = {
        roles: {
          code: ZodIssueCode.invalid_type,
          message: 'Roles must be valid',
        },
      }
      mockValidatePayload.mockReturnValue({
        success: false,
        data: null,
        errors: validationErrors,
      })
      mockUserIsOwner.mockResolvedValue(true)

      const result = await handleUpdateOrgMember(
        organizationId,
        memberId,
        payload,
      )

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
      const result = await handleUpdateOrgMember(
        organizationId,
        memberId,
        payload,
      )

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

  describe('handleUpdateActiveUserOrgMember', () => {
    const organizationId = 'org-123'
    const payload = { roles: [MemberRole.manager] }

    it('should update active user organization member when user is member', async () => {
      const updatedMember = { ...mockOrgMember, ...payload }
      mockUserIsMember.mockResolvedValue(true)
      mockGetActiveUserOrgMember.mockResolvedValue(mockOrgMember)
      mockUpdateOrgMember.mockResolvedValue(updatedMember)

      const result = await handleUpdateActiveUserOrgMember(
        organizationId,
        payload,
      )

      expect(result).toEqual({
        status: 200,
        data: updatedMember,
        message: 'Member updated successfully.',
      })
      expect(mockValidatePayload).toHaveBeenCalled()
      expect(mockUpdateOrgMember).toHaveBeenCalledWith({
        organizationId,
        memberId: mockOrgMember.id,
        payload: expect.objectContaining({
          ...payload,
          updatedBy: mockUser.id,
        }),
      })
    })

    it('should return 403 when user is not member', async () => {
      mockUserIsMember.mockResolvedValue(false)

      const result = await handleUpdateActiveUserOrgMember(
        organizationId,
        payload,
      )

      expect(result).toEqual({
        status: 403,
        data: null,
        error: {
          code: FetchErrorCode.AUTH,
          message: 'Unauthorized to update your organization membership.',
        },
      })
    })

    it('should return 400 when validation fails', async () => {
      const validationErrors = {
        roles: { code: ZodIssueCode.invalid_type, message: 'Invalid roles' },
      }
      mockValidatePayload.mockReturnValue({
        success: false,
        data: null,
        errors: validationErrors,
      })
      mockUserIsMember.mockResolvedValue(true)
      mockGetActiveUserOrgMember.mockResolvedValue(mockOrgMember)

      const result = await handleUpdateActiveUserOrgMember(
        organizationId,
        payload,
      )

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
  })

  describe('handleDeleteOrgMember', () => {
    const organizationId = 'org-123'
    const memberId = 'member-456'

    it('should delete organization member when user is owner', async () => {
      mockUserIsOwner.mockResolvedValue(true)
      mockDeleteOrgMember.mockResolvedValue(mockOrgMember)

      const result = await handleDeleteOrgMember(organizationId, memberId)

      expect(result).toEqual({
        status: 200,
        data: mockOrgMember,
        message: 'Member removed from organization successfully.',
      })
      expect(mockDeleteOrgMember).toHaveBeenCalledWith({
        organizationId,
        memberId,
      })
    })

    it('should return 403 when user is not owner', async () => {
      mockUserIsOwner.mockResolvedValue(false)

      const result = await handleDeleteOrgMember(organizationId, memberId)

      expect(result).toEqual({
        status: 403,
        data: null,
        error: {
          code: FetchErrorCode.AUTH,
          message: 'Unauthorized to delete organization members.',
        },
      })
    })

    it('should return 500 when authorization check fails', async () => {
      mockUserIsOwner.mockRejectedValue(new Error('Database error'))

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const result = await handleDeleteOrgMember(organizationId, memberId)

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
})
