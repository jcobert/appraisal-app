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
          area: 'organization',
          action: 'edit_org_info',
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
          area: 'organization',
          action: 'view_org_member_details',
          organizationId: mockOrgId,
        },
      })

      expect(can).toBe(true)
      expect(redirect).not.toHaveBeenCalled()
    })
  })

  describe('getSessionData', () => {
    it('should return complete session data', async () => {
      const mockProfile = {
        id: 'profile_123',
        accountId: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: null,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      }
      const mockOrgs = [{ id: 'org_123', name: 'Test Org' }]

      const getKindeServerSession = jest.requireMock(
        '@kinde-oss/kinde-auth-nextjs/server',
      ).getKindeServerSession
      getKindeServerSession.mockImplementation(() => ({
        isAuthenticated: jest.fn().mockResolvedValue(true),
        getUser: jest.fn().mockResolvedValue(mockUser),
      }))
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(mockProfile)
      ;(mockDb.organization.findMany as jest.Mock).mockResolvedValue(mockOrgs)

      const result = await getSessionData()
      expect(result).toEqual({
        account: mockUser,
        loggedIn: true,
        profile: mockProfile,
        organizations: mockOrgs,
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
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(mockDb.organization.findMany as jest.Mock).mockResolvedValue(null)

      const result = await getSessionData()
      expect(result).toEqual({
        account: null,
        loggedIn: false,
        profile: null,
        organizations: [],
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

      expect(result).toEqual({
        organization: [],
        orders: [],
      })
    })

    it('should return correct permissions based on user roles', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
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
      expect(result.organization).toContain(
        'view_org_member_details' satisfies PermissionAction['organization'],
      )
      expect(result.organization).not.toContain(
        'delete_org' satisfies PermissionAction['organization'],
      )
      expect(result.orders).toContain(
        'create_order' satisfies PermissionAction['orders'],
      )
      expect(result.orders).toContain(
        'edit_order' satisfies PermissionAction['orders'],
      )
      expect(result.orders).toContain(
        'delete_order' satisfies PermissionAction['orders'],
      )
      expect(result.orders).toContain(
        'view_orders' satisfies PermissionAction['orders'],
      )

      // Manager should not have these permissions
      expect(result.organization).not.toContain('delete_org')
      expect(result.organization).not.toContain('edit_org_info')
    })
  })

  describe('userCan', () => {
    it('should return false when user has no roles', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue(null)

      const result = await userCan({
        area: 'organization',
        action: 'edit_org_members',
        organizationId: mockOrgId,
      })

      expect(result).toBe(false)
    })

    it('should return true when user has required role', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
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
        area: 'organization',
        action: 'view_org_member_details',
        organizationId: mockOrgId,
      })

      expect(result).toBe(true)
    })

    it('should return false when user lacks required role', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
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
        area: 'organization',
        action: 'edit_org_members',
        organizationId: mockOrgId,
      })

      expect(result).toBe(false)
    })

    it('should return false when member is inactive', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: false,
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
        area: 'organization',
        action: 'view_org',
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

      const wrappedFn = withPermission('orders', 'create_order', mockFn)
      const result = await wrappedFn(mockOrgId)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledWith(mockOrgId)
    })

    it('should return null when user lacks permission', async () => {
      mockGetActiveUserOrgMember.mockResolvedValue({
        id: 'member-123',
        active: true,
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

      const wrappedFn = withPermission('organization', 'delete_org', mockFn)
      const result = await wrappedFn(mockOrgId)

      expect(result).toBeNull()
      expect(mockFn).not.toHaveBeenCalled()
    })
  })
})
