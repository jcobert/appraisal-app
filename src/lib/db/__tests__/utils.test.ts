import { redirect } from 'next/navigation'

import {
  getSessionData,
  getUserPermissions,
  protectPage,
  userCan,
  withPermission,
} from '@/lib/db/utils'

import { PermissionAction } from '@/configuration/permissions'

// Mock the DB queries
const mockGetOrgMemberRoles = jest.fn()
const mockGetActiveUserProfile = jest.fn()
const mockGetUserOrganizations = jest.fn()

jest.mock('@/lib/db/queries/organization', () => ({
  getOrgMemberRoles: (...args: any[]) => mockGetOrgMemberRoles(...args),
  getUserOrganizations: (...args: any[]) => mockGetUserOrganizations(...args),
}))

jest.mock('@/lib/db/queries/user', () => ({
  getActiveUserProfile: (...args: any[]) => mockGetActiveUserProfile(...args),
}))

type KindeUser = {
  id: string
  email?: string
  given_name?: string
  family_name?: string
}

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
}))

describe('db utils', () => {
  const mockUser: KindeUser = {
    id: 'user_123',
    email: 'test@example.com',
    given_name: 'Test',
    family_name: 'User',
  }

  const mockOrgId = 'org_123'

  beforeEach(() => {
    jest.clearAllMocks()
    
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
      mockGetOrgMemberRoles.mockResolvedValue([])

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
      mockGetOrgMemberRoles.mockResolvedValue(['manager'])

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
      const mockProfile = { id: 'profile_123', userId: 'user_123' }
      const mockOrgs = [{ id: 'org_123', name: 'Test Org' }]

      const getKindeServerSession = jest.requireMock(
        '@kinde-oss/kinde-auth-nextjs/server',
      ).getKindeServerSession
      getKindeServerSession.mockImplementation(() => ({
        isAuthenticated: jest.fn().mockResolvedValue(true),
        getUser: jest.fn().mockResolvedValue(mockUser),
      }))

      mockGetActiveUserProfile.mockResolvedValue(mockProfile)
      mockGetUserOrganizations.mockResolvedValue(mockOrgs)

      const result = await getSessionData()
      expect(result).toEqual({
        user: mockUser,
        loggedIn: true,
        profile: mockProfile,
        organizations: mockOrgs,
      })
    })
  })

  describe('getUserPermissions', () => {
    it('should return empty permissions when user has no roles', async () => {
      mockGetOrgMemberRoles.mockResolvedValue([])

      const result = await getUserPermissions(mockOrgId)

      expect(result).toEqual({
        organization: [],
        orders: [],
      })
    })

    it('should return correct permissions based on user roles', async () => {
      mockGetOrgMemberRoles.mockResolvedValue(['manager'])

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
      mockGetOrgMemberRoles.mockResolvedValue([])

      const result = await userCan({
        area: 'organization',
        action: 'edit_org_members',
        organizationId: mockOrgId,
      })

      expect(result).toBe(false)
    })

    it('should return true when user has required role', async () => {
      mockGetOrgMemberRoles.mockResolvedValue(['manager'])

      const result = await userCan({
        area: 'organization',
        action: 'view_org_member_details',
        organizationId: mockOrgId,
      })

      expect(result).toBe(true)
    })

    it('should return false when user lacks required role', async () => {
      mockGetOrgMemberRoles.mockResolvedValue(['appraiser'])

      const result = await userCan({
        area: 'organization',
        action: 'edit_org_members',
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
      mockGetOrgMemberRoles.mockResolvedValue(['manager'])

      const wrappedFn = withPermission('orders', 'create_order', mockFn)
      const result = await wrappedFn(mockOrgId)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledWith(mockOrgId)
    })

    it('should return null when user lacks permission', async () => {
      mockGetOrgMemberRoles.mockResolvedValue(['appraiser'])

      const wrappedFn = withPermission('organization', 'delete_org', mockFn)
      const result = await wrappedFn(mockOrgId)

      expect(result).toBeNull()
      expect(mockFn).not.toHaveBeenCalled()
    })
  })
})
