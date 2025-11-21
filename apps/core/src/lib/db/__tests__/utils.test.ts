/**
 * @jest-environment node
 */
import { redirect } from 'next/navigation'

import { db } from '@/lib/db/client'
import { getActiveUserOrgMember } from '@/lib/db/queries/organization'
import {
  canQuery,
  getSessionData,
  getUserPermissions,
  protectPage,
  userCan,
  withPermission,
} from '@/lib/db/utils'

import { isAuthenticated } from '@/utils/auth'

import { SessionUser } from '@/types/auth'

import { PermissionAction } from '@/configuration/permissions'

jest.mock('@/lib/db/client', () => ({
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

// Mock the DB queries
const mockGetActiveUserOrgMember =
  getActiveUserOrgMember as jest.MockedFunction<typeof getActiveUserOrgMember>

const mockDb = db as jest.Mocked<typeof db>
const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

// Mock Kinde auth
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: jest.fn(() => ({
    isAuthenticated: async () => true,
    getUser: async () => ({
      id: 'user_123',
      email: 'test@example.com',
      given_name: 'Test',
      family_name: 'User',
    }),
  })),
}))

// Mock auth utils
jest.mock('@/utils/auth', () => ({
  isAuthenticated: jest.fn(),
  getActiveUserAccount: jest.fn(),
}))

describe('db utils', () => {
  const mockUser: SessionUser = {
    id: 'user_123',
    email: 'test@example.com',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/avatar.jpg',
  }

  const mockOrgId = 'org_123'

  const mockOrganization = {
    id: mockOrgId,
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

    const organizations = [mockOrganization]
    ;(mockDb.organization.findMany as jest.Mock).mockResolvedValue(
      organizations,
    )

    // Default mock for isAuthenticated
    const { isAuthenticated } = jest.requireMock('@/utils/auth')
    isAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })
  })

  describe('protectPage', () => {
    it('should not redirect when user is authenticated', async () => {
      const { isAuthenticated } = jest.requireMock('@/utils/auth')
      isAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })

      const { can } = await protectPage()
      expect(can).toBe(true)
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should redirect to specified URL when user is not authenticated', async () => {
      const { isAuthenticated } = jest.requireMock('@/utils/auth')
      isAuthenticated.mockResolvedValue({ allowed: false, user: null })

      const redirectUrl = '/custom-login'
      await protectPage({ redirect: redirectUrl })
      expect(redirect).toHaveBeenCalledWith(redirectUrl)
    })

    it('should redirect by default when user is not authenticated and path not provided', async () => {
      const { isAuthenticated } = jest.requireMock('@/utils/auth')
      isAuthenticated.mockResolvedValue({ allowed: false, user: {} })

      await protectPage()
      expect(redirect).toHaveBeenCalledWith('/')
    })

    it('should redirect when user lacks required permission', async () => {
      const { isAuthenticated } = jest.requireMock('@/utils/auth')
      isAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })

      // Mock user having no roles (no permissions)
      mockGetActiveUserOrgMember.mockResolvedValue(null)

      await protectPage({
        permission: {
          action: 'organization:edit',
          organizationId: mockOrgId,
        },
      })

      expect(redirect).toHaveBeenCalled()
    })

    it('should not redirect when user has required permission', async () => {
      const { isAuthenticated } = jest.requireMock('@/utils/auth')
      isAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })

      // Mock user having manager role
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
        isOwner: false,
        roles: ['manager'],
        user: {
          id: 'user-profile-123',
          accountId: 'user_123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        },
      })

      const { can } = await protectPage({
        permission: {
          action: 'members:view_details',
          organizationId: mockOrgId,
        },
      })

      expect(can).toBe(true)
      expect(redirect).not.toHaveBeenCalled()
    })
  })

  describe('getSessionData', () => {
    it('should return auth session data', async () => {
      const getKindeServerSession = jest.requireMock(
        '@kinde-oss/kinde-auth-nextjs/server',
      ).getKindeServerSession
      getKindeServerSession.mockImplementation(() => ({
        isAuthenticated: jest.fn().mockResolvedValue(true),
        getUser: jest.fn().mockResolvedValue(mockUser),
      }))

      const result = await getSessionData()
      expect(result).toEqual({
        account: mockUser,
        loggedIn: true,
      })
    })

    it('should handle no user gracefully', async () => {
      const getKindeServerSession = jest.requireMock(
        '@kinde-oss/kinde-auth-nextjs/server',
      ).getKindeServerSession
      getKindeServerSession.mockImplementation(() => ({
        isAuthenticated: jest.fn().mockResolvedValue(false),
        getUser: jest.fn().mockResolvedValue(null),
      }))

      const result = await getSessionData()
      expect(result).toEqual({
        account: null,
        loggedIn: false,
      })
    })
  })

  describe('canQuery', () => {
    it('should return true when user is authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })

      const result = await canQuery()

      expect(result).toBe(true)
    })

    it('should return false when user is not authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

      const result = await canQuery()

      expect(result).toBe(false)
    })
  })

  describe('getUserPermissions', () => {
    it('should return empty permissions when user has no roles', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue(null)

      const result = await getUserPermissions(mockOrgId)

      expect(result).toEqual([])
    })

    it('should return correct permissions based on user roles', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
        isOwner: false,
        roles: ['manager'],
        user: {
          id: 'user-profile-123',
          accountId: 'user_123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        },
      })

      const result = await getUserPermissions(mockOrgId)

      // Manager should have these permissions based on APP_PERMISSIONS
      expect(result).toContain(
        'members:view_details' satisfies PermissionAction,
      )
      expect(result).not.toContain(
        'organization:delete' satisfies PermissionAction,
      )
      expect(result).toContain('orders:create' satisfies PermissionAction)
      expect(result).toContain('orders:edit' satisfies PermissionAction)
      expect(result).toContain('orders:delete' satisfies PermissionAction)
      expect(result).toContain('orders:view' satisfies PermissionAction)

      // Manager should not have these permissions
      expect(result).not.toContain('organization:delete')
      expect(result).not.toContain('organization:edit')
    })

    it('should include owner-only permissions when user is owner', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
        isOwner: true,
        roles: ['admin'],
        user: {
          id: 'user-profile-123',
          accountId: 'user_123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        },
      })

      const result = await getUserPermissions(mockOrgId)

      // Owner should have owner-only permissions
      expect(result).toContain('organization:delete' satisfies PermissionAction)
      expect(result).toContain(
        'organization:transfer' satisfies PermissionAction,
      )
    })

    it('should not include owner-only permissions when user is not owner', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
        isOwner: false,
        roles: ['admin'],
        user: {
          id: 'user-profile-123',
          accountId: 'user_123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        },
      })

      const result = await getUserPermissions(mockOrgId)

      // Non-owner should not have owner-only permissions
      expect(result).not.toContain('organization:delete')
      expect(result).not.toContain('organization:transfer')
    })
  })

  describe('userCan', () => {
    it('should return false when user has no roles', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue(null)

      const result = await userCan({
        action: 'members:edit',
        organizationId: mockOrgId,
      })

      expect(result).toBe(false)
    })

    it('should return true when user has required role', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
        isOwner: false,
        roles: ['manager'],
        user: {
          id: 'user-profile-123',
          accountId: 'user_123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        },
      })

      const result = await userCan({
        action: 'members:view_details',
        organizationId: mockOrgId,
      })

      expect(result).toBe(true)
    })

    it('should return false when user lacks required role', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
        isOwner: false,
        roles: ['appraiser'],
        user: {
          id: 'user-profile-123',
          accountId: 'user_123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        },
      })

      const result = await userCan({
        action: 'members:edit',
        organizationId: mockOrgId,
      })

      expect(result).toBe(false)
    })

    it('should return false when member is inactive', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: false,
        isOwner: false,
        roles: ['manager'],
        user: {
          id: 'user-profile-123',
          accountId: 'user_123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        },
      })

      const result = await userCan({
        action: 'organization:view',
        organizationId: mockOrgId,
      })

      expect(result).toBe(false)
    })

    it('should return true when user is owner and permission requires ownership', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
        isOwner: true,
        roles: ['admin'],
        user: {
          id: 'user-profile-123',
          accountId: 'user_123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        },
      })

      const result = await userCan({
        action: 'organization:delete',
        organizationId: mockOrgId,
      })

      expect(result).toBe(true)
    })

    it('should return false when user is not owner but permission requires ownership', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
        isOwner: false,
        roles: ['admin'],
        user: {
          id: 'user-profile-123',
          accountId: 'user_123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        },
      })

      const result = await userCan({
        action: 'organization:transfer',
        organizationId: mockOrgId,
      })

      expect(result).toBe(false)
    })
  })

  describe('withPermission', () => {
    const mockFn = jest.fn().mockResolvedValue('success')

    beforeEach(() => {
      mockFn.mockClear()
    })

    it('should execute function when user has permission', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
        isOwner: false,
        roles: ['manager'],
        user: {
          id: 'user-profile-123',
          accountId: 'user_123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        },
      })

      const wrappedFn = withPermission('orders:create', mockFn)
      const result = await wrappedFn(mockOrgId)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledWith(mockOrgId)
    })

    it('should return null when user lacks permission', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
        isOwner: false,
        roles: ['appraiser'],
        user: {
          id: 'user-profile-123',
          accountId: 'user_123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: null,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        },
      })

      const wrappedFn = withPermission('organization:delete', mockFn)
      const result = await wrappedFn(mockOrgId)

      expect(result).toBeNull()
      expect(mockFn).not.toHaveBeenCalled()
    })
  })
})
