import {
  OrganizationProvider,
  useActiveOrgPermissions,
  useOrganizationContext,
} from '../organization-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'

import { usePermissions } from '@/hooks/use-permissions'
import { useStoredSettings } from '@/hooks/use-stored-settings'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'

// Mock dependencies
jest.mock('@/hooks/use-stored-settings')
jest.mock('@/features/organization/hooks/use-get-organizations')
jest.mock('@/hooks/use-permissions')

const mockUseStoredSettings = useStoredSettings as jest.MockedFunction<
  typeof useStoredSettings
>
const mockUseGetOrganizations = useGetOrganizations as jest.MockedFunction<
  typeof useGetOrganizations
>
const mockUsePermissions = usePermissions as jest.MockedFunction<
  typeof usePermissions
>

// Test data with proper Organization type
const mockOrganizations = [
  {
    id: 'org-1',
    name: 'Organization 1',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
  },
  {
    id: 'org-2',
    name: 'Organization 2',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
  },
  {
    id: 'org-3',
    name: 'Organization 3',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
  },
]

const mockPermissionsOrg1 = {
  can: jest.fn((action: string) => {
    // User has full permissions for org-1
    return [
      'edit_org_info',
      'edit_org_members',
      'delete_org',
      'view_org',
      'view_org_member_details',
    ].includes(action)
  }),
  isLoading: false,
  error: null,
}

const mockPermissionsOrg2 = {
  can: jest.fn((action: string) => {
    // User only has view permissions for org-2
    return ['view_org'].includes(action)
  }),
  isLoading: false,
  error: null,
}

const mockPermissionsOrg3 = {
  can: jest.fn(() => false), // No permissions for org-3
  isLoading: false,
  error: null,
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider userId='foo123'>{children}</OrganizationProvider>
    </QueryClientProvider>
  )
}

describe('OrganizationProvider Security Tests', () => {
  let mockUpdateSettings: jest.Mock
  let mockInvalidateQueries: jest.Mock

  beforeEach(() => {
    mockUpdateSettings = jest.fn()
    mockInvalidateQueries = jest.fn()

    // Reset all mocks
    jest.clearAllMocks()

    // Default mock implementations
    mockUseStoredSettings.mockReturnValue({
      settings: { activeOrgId: 'org-1' },
      updateSettings: mockUpdateSettings,
      clearSettings: jest.fn(),
    })

    // Simplified mock for useGetOrganizations
    mockUseGetOrganizations.mockReturnValue({
      response: { data: mockOrganizations },
    } as any)

    // Mock permissions based on organizationId
    mockUsePermissions.mockImplementation(({ organizationId }) => {
      switch (organizationId) {
        case 'org-1':
          return mockPermissionsOrg1
        case 'org-2':
          return mockPermissionsOrg2
        case 'org-3':
          return mockPermissionsOrg3
        default:
          return { can: jest.fn(() => false), isLoading: false, error: null }
      }
    })
  })

  describe('Active Organization Context', () => {
    it('should provide permissions for the active organization only', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useActiveOrgPermissions(), {
        wrapper,
      })

      // Should have permissions for org-1 (active org)
      expect(result.current.can('edit_org_info')).toBe(true)
      expect(result.current.can('edit_org_members')).toBe(true)
      expect(result.current.can('delete_org')).toBe(true)
    })

    it('should NOT provide permissions for non-active organizations', () => {
      // Set org-2 as active (only has view permissions)
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-2' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useActiveOrgPermissions(), {
        wrapper,
      })

      // Should NOT have edit permissions for org-2
      expect(result.current.can('edit_org_info')).toBe(false)
      expect(result.current.can('edit_org_members')).toBe(false)
      expect(result.current.can('delete_org')).toBe(false)

      // Should only have view permission
      expect(result.current.can('view_org')).toBe(true)
    })

    it('should deny all permissions when no active organization is set', () => {
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: undefined },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useActiveOrgPermissions(), {
        wrapper,
      })

      // Should deny all permissions when no active org
      expect(result.current.can('edit_org_info')).toBe(false)
      expect(result.current.can('view_org')).toBe(false)
    })
  })

  describe('Organization Switching Security', () => {
    it('should invalidate permissions when switching organizations', async () => {
      const queryClient = new QueryClient()
      queryClient.invalidateQueries = mockInvalidateQueries

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <OrganizationProvider userId='foo123'>
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      const { result } = renderHook(() => useOrganizationContext(), { wrapper })

      await result.current.switchOrganization('org-2')

      expect(mockUpdateSettings).toHaveBeenCalledWith({ activeOrgId: 'org-2' })
      expect(mockInvalidateQueries).toHaveBeenCalledWith(
        expect.objectContaining({
          exact: true,
          type: 'all',
          refetchType: 'all',
        }),
      )
    })

    it('should not update permissions when switching to the same organization', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useOrganizationContext(), { wrapper })

      await result.current.switchOrganization('org-1') // Already active

      expect(mockUpdateSettings).not.toHaveBeenCalled()
      expect(mockInvalidateQueries).not.toHaveBeenCalled()
    })

    it('should properly update permissions after organization switch', async () => {
      const wrapper = createWrapper()
      const { result, rerender } = renderHook(() => useActiveOrgPermissions(), {
        wrapper,
      })

      // Initially org-1 permissions
      expect(result.current.can('edit_org_info')).toBe(true)

      // Simulate organization switch to org-2 (limited permissions)
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-2' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      rerender()

      // Should now have org-2 permissions (limited)
      expect(result.current.can('edit_org_info')).toBe(false)
      expect(result.current.can('view_org')).toBe(true)
    })
  })

  describe('Security Edge Cases', () => {
    it('should handle invalid organization IDs securely', () => {
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'invalid-org-id' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useActiveOrgPermissions(), {
        wrapper,
      })

      // Should deny all permissions for invalid org
      expect(result.current.can('edit_org_info')).toBe(false)
      expect(result.current.can('view_org')).toBe(false)
    })

    it('should handle permissions loading state securely', () => {
      mockUsePermissions.mockReturnValue({
        can: jest.fn(() => false),
        isLoading: true,
        error: null,
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useActiveOrgPermissions(), {
        wrapper,
      })

      // Should deny permissions while loading
      expect(result.current.can('edit_org_info')).toBe(false)
      expect(result.current.isLoading).toBe(true)
    })

    it('should handle permissions error state securely', () => {
      mockUsePermissions.mockReturnValue({
        can: jest.fn(() => false),
        isLoading: false,
        error: new Error('Permissions fetch failed'),
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useActiveOrgPermissions(), {
        wrapper,
      })

      // Should deny permissions on error
      expect(result.current.can('edit_org_info')).toBe(false)
      expect(result.current.error).toBeDefined()
    })

    it('should require provider context to function', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        renderHook(() => useOrganizationContext())
      }).toThrow(
        'useOrganizationContext must be used within an OrganizationProvider',
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Permission Isolation Tests', () => {
    it('should ensure permissions are isolated per organization', () => {
      // Test that permissions for one org don't leak to another
      const wrapper = createWrapper()

      // Test org-1 permissions
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-1' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      const { result: result1 } = renderHook(() => useActiveOrgPermissions(), {
        wrapper,
      })
      expect(result1.current.can('delete_org')).toBe(true)

      // Test org-3 permissions (no permissions)
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-3' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      const { result: result3 } = renderHook(() => useActiveOrgPermissions(), {
        wrapper,
      })
      expect(result3.current.can('delete_org')).toBe(false)
      expect(result3.current.can('view_org')).toBe(false)
    })

    it('should verify permission actions are type-safe', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useActiveOrgPermissions(), {
        wrapper,
      })

      // Valid permission actions should work
      expect(() => result.current.can('edit_org_info')).not.toThrow()
      expect(() => result.current.can('view_org')).not.toThrow()

      // The TypeScript compiler should prevent invalid actions at compile time
      // This test verifies the types are properly defined
      expect(typeof result.current.can).toBe('function')
    })
  })

  describe('Auto-selection Security', () => {
    it('should auto-select first organization when none is active', () => {
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: undefined },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      const wrapper = createWrapper()
      renderHook(() => useOrganizationContext(), { wrapper })

      expect(mockUpdateSettings).toHaveBeenCalledWith({ activeOrgId: 'org-1' })
    })

    it('should not auto-select when no organizations are available', () => {
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: undefined },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      mockUseGetOrganizations.mockReturnValue({
        response: { data: [] },
      } as any)

      const wrapper = createWrapper()
      renderHook(() => useOrganizationContext(), { wrapper })

      expect(mockUpdateSettings).not.toHaveBeenCalled()
    })
  })

  describe('User-Scoped Storage Integration', () => {
    it('should pass userId to useStoredSettings hook', () => {
      const wrapper = createWrapper()
      renderHook(() => useOrganizationContext(), { wrapper })

      expect(mockUseStoredSettings).toHaveBeenCalledWith({
        userId: 'foo123',
      })
    })

    it('should handle undefined userId gracefully', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <OrganizationProvider userId={undefined as any}>
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      renderHook(() => useOrganizationContext(), { wrapper })

      expect(mockUseStoredSettings).toHaveBeenCalledWith({
        userId: undefined,
      })
    })

    it('should work with different userIds without cross-contamination', () => {
      // Test that different userIds get different storage calls
      const queryClient1 = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      const wrapper1 = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient1}>
          <OrganizationProvider userId='user-1'>
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      renderHook(() => useOrganizationContext(), { wrapper: wrapper1 })

      expect(mockUseStoredSettings).toHaveBeenCalledWith({
        userId: 'user-1',
      })

      // Clear mocks and test second user
      jest.clearAllMocks()
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-1' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      const queryClient2 = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      const wrapper2 = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient2}>
          <OrganizationProvider userId='user-2'>
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      renderHook(() => useOrganizationContext(), { wrapper: wrapper2 })

      expect(mockUseStoredSettings).toHaveBeenCalledWith({
        userId: 'user-2',
      })
    })
  })

  describe('Invalid Stored Organization Cleanup', () => {
    it('should clear stored org when user no longer has access', () => {
      // Mock stored org that user doesn't have access to
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'inaccessible-org' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      // User only has access to org-1, org-2, org-3
      mockUseGetOrganizations.mockReturnValue({
        response: { data: mockOrganizations },
      } as any)

      const wrapper = createWrapper()
      renderHook(() => useOrganizationContext(), { wrapper })

      // Should clear the invalid stored org
      expect(mockUpdateSettings).toHaveBeenCalledWith({ activeOrgId: '' })
    })

    it('should not clear stored org when user still has access', () => {
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-2' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      const wrapper = createWrapper()
      renderHook(() => useOrganizationContext(), { wrapper })

      // Should not clear the valid stored org
      expect(mockUpdateSettings).not.toHaveBeenCalledWith({ activeOrgId: '' })
    })

    it('should handle stored org validation with empty organizations list', () => {
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-1' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      mockUseGetOrganizations.mockReturnValue({
        response: { data: [] }, // No organizations available
      } as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useOrganizationContext(), { wrapper })

      // Should clear stored org when no organizations are available
      expect(mockUpdateSettings).toHaveBeenCalledWith({ activeOrgId: '' })

      // selectedOrganization should be undefined
      expect(result.current.selectedOrganization).toBeUndefined()
    })

    it('should clear stored org when organizations data loads and user has no access', () => {
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-that-user-lost-access-to' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      // Organizations load but user doesn't have access to stored org
      mockUseGetOrganizations.mockReturnValue({
        response: { data: mockOrganizations }, // Has orgs, but not the stored one
      } as any)

      const wrapper = createWrapper()
      renderHook(() => useOrganizationContext(), { wrapper })

      // Should clear the invalid stored org
      expect(mockUpdateSettings).toHaveBeenCalledWith({ activeOrgId: '' })
    })
  })

  describe('Server-side Props Integration', () => {
    it('should work with initialOrganizations prop', () => {
      const initialOrgs = [mockOrganizations[0]!] // Only one org initially

      mockUseGetOrganizations.mockReturnValue({
        response: { data: null }, // No data from API yet
      } as any)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <OrganizationProvider
            userId='user-123'
            initialOrganizations={initialOrgs}
          >
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      const { result } = renderHook(() => useOrganizationContext(), {
        wrapper,
      })

      expect(result.current.organizations).toEqual(initialOrgs)
    })

    it('should prefer API data over initialOrganizations when available', () => {
      const initialOrgs = [mockOrganizations[0]!]

      mockUseGetOrganizations.mockReturnValue({
        response: { data: mockOrganizations }, // Full API data
      } as any)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <OrganizationProvider
            userId='user-123'
            initialOrganizations={initialOrgs}
          >
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      const { result } = renderHook(() => useOrganizationContext(), {
        wrapper,
      })

      // Should use API data, not initial data
      expect(result.current.organizations).toEqual(mockOrganizations)
      expect(result.current.organizations).not.toEqual(initialOrgs)
    })

    it('should only fetch organizations when userId is provided', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <OrganizationProvider userId={undefined as any}>
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      renderHook(() => useOrganizationContext(), { wrapper })

      // Should be called with enabled: false when no userId
      expect(mockUseGetOrganizations).toHaveBeenCalledWith({
        options: { enabled: false },
      })
    })
  })
})
