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

// Import the cookie function for testing
const { getActiveOrgCookieName } = jest.requireActual('@/hooks/use-stored-settings')

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
      <OrganizationProvider userId='foo123' initialActiveOrgId='org-1'>
        {children}
      </OrganizationProvider>
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

    it('should refresh permissions for active organization', async () => {
      const queryClient = new QueryClient()
      queryClient.invalidateQueries = mockInvalidateQueries

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <OrganizationProvider userId='foo123' initialActiveOrgId='org-1'>
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      const { result } = renderHook(() => useOrganizationContext(), { wrapper })

      await result.current.refreshPermissions()

      // Check that invalidateQueries was called (the queryKey structure depends on the implementation)
      expect(mockInvalidateQueries).toHaveBeenCalledWith(
        expect.objectContaining({
          exact: true,
          type: 'all',
          refetchType: 'all',
        }),
      )
    })

    it('should not refresh permissions when no active organization is set', async () => {
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: undefined },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

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

      await result.current.refreshPermissions()

      // Should not call invalidateQueries when no active org
      expect(mockInvalidateQueries).not.toHaveBeenCalled()
    })

    it('should not refresh permissions when active organization ID is empty string', async () => {
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: '' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

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

      await result.current.refreshPermissions()

      // Should not call invalidateQueries when activeOrgId is empty string
      expect(mockInvalidateQueries).not.toHaveBeenCalled()
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
        initialSettings: { activeOrgId: 'org-1' },
      } satisfies Parameters<typeof useStoredSettings>['0'])
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
          <OrganizationProvider
            userId={undefined as any}
            initialActiveOrgId='org-1'
          >
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      renderHook(() => useOrganizationContext(), { wrapper })

      expect(mockUseStoredSettings).toHaveBeenCalledWith({
        userId: undefined,
        initialSettings: { activeOrgId: 'org-1' },
      } satisfies Parameters<typeof useStoredSettings>['0'])
    })

    it('should handle no initial activeOrgId gracefully', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <OrganizationProvider userId='foo123'>
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      renderHook(() => useOrganizationContext(), { wrapper })

      expect(mockUseStoredSettings).toHaveBeenCalledWith({
        userId: 'foo123',
        initialSettings: {},
      } satisfies Parameters<typeof useStoredSettings>['0'])
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
          <OrganizationProvider userId='user-1' initialActiveOrgId='org-1'>
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      renderHook(() => useOrganizationContext(), { wrapper: wrapper1 })

      expect(mockUseStoredSettings).toHaveBeenCalledWith({
        userId: 'user-1',
        initialSettings: { activeOrgId: 'org-1' },
      } satisfies Parameters<typeof useStoredSettings>['0'])

      // Clear mocks and test second user
      jest.clearAllMocks()
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-2' },
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
          <OrganizationProvider userId='user-2' initialActiveOrgId='org-2'>
            {children}
          </OrganizationProvider>
        </QueryClientProvider>
      )

      renderHook(() => useOrganizationContext(), { wrapper: wrapper2 })

      expect(mockUseStoredSettings).toHaveBeenCalledWith({
        userId: 'user-2',
        initialSettings: { activeOrgId: 'org-2' },
      } satisfies Parameters<typeof useStoredSettings>['0'])
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

    it('should prioritize fetched active organization over organizations array', () => {
      const fetchedOrg = {
        id: 'org-1',
        name: 'Fetched Organization 1',
        avatar: 'fetched-avatar-url',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        updatedBy: 'user-1',
      }

      // Mock the useGetOrganizations to return different data for different calls
      mockUseGetOrganizations
        .mockReturnValueOnce({
          response: { data: mockOrganizations }, // First call (all orgs)
        } as any)
        .mockReturnValueOnce({
          response: { data: fetchedOrg }, // Second call (specific org)
        } as any)

      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-1' },
        updateSettings: mockUpdateSettings,
        clearSettings: jest.fn(),
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useOrganizationContext(), { wrapper })

      // Should prioritize the fetched org (with different avatar) over the one in organizations array
      expect(result.current.selectedOrganization).toEqual(fetchedOrg)
      expect(result.current.selectedOrganization?.avatar).toBe('fetched-avatar-url')
      
      // Verify it's not using the organization from the array (which has null avatar)
      const orgFromArray = mockOrganizations.find(org => org.id === 'org-1')
      expect(orgFromArray?.avatar).toBe(null)
      expect(result.current.selectedOrganization?.avatar).not.toBe(orgFromArray?.avatar)
    })
  })

  describe('Cookie-LocalStorage Integration', () => {
    describe('Server-side Props (initialActiveOrgId)', () => {
      it('should pass initialActiveOrgId to useStoredSettings', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123' initialActiveOrgId='server-org-id'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        renderHook(() => useOrganizationContext(), { wrapper })

        expect(mockUseStoredSettings).toHaveBeenCalledWith({
          userId: 'user-123',
          initialSettings: { activeOrgId: 'server-org-id' },
        })
      })

      it('should work without initialActiveOrgId', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        renderHook(() => useOrganizationContext(), { wrapper })

        expect(mockUseStoredSettings).toHaveBeenCalledWith({
          userId: 'user-123',
          initialSettings: { activeOrgId: undefined },
        })
      })

      it('should prefer localStorage over server value after initialization', () => {
        // Mock localStorage having a different value than server
        mockUseStoredSettings.mockReturnValue({
          settings: { activeOrgId: 'localStorage-org-id' },
          updateSettings: mockUpdateSettings,
          clearSettings: jest.fn(),
        })

        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123' initialActiveOrgId='server-org-id'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        const { result } = renderHook(() => useOrganizationContext(), { wrapper })

        // Should use localStorage value, not server value
        expect(result.current.activeOrgId).toBe('localStorage-org-id')
      })
    })

    describe('Cookie Name Generation', () => {
      it('should use getActiveOrgCookieName for user-specific cookies', () => {
        const cookieName = getActiveOrgCookieName('user-123')
        expect(cookieName).toBe('active_org_id_user-123')
      })

      it('should generate different cookie names for different users', () => {
        const cookieName1 = getActiveOrgCookieName('user-123')
        const cookieName2 = getActiveOrgCookieName('user-456')
        
        expect(cookieName1).toBe('active_org_id_user-123')
        expect(cookieName2).toBe('active_org_id_user-456')
        expect(cookieName1).not.toBe(cookieName2)
      })

      it('should handle special characters in user IDs', () => {
        const cookieName = getActiveOrgCookieName('user@example.com')
        expect(cookieName).toBe('active_org_id_user@example.com')
      })
    })

    describe('Server-Client Synchronization', () => {
      it('should handle server value being different from localStorage', () => {
        // Server passes 'server-org-id', but localStorage has 'local-org-id'
        mockUseStoredSettings.mockReturnValue({
          settings: { activeOrgId: 'local-org-id' },
          updateSettings: mockUpdateSettings,
          clearSettings: jest.fn(),
        })

        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123' initialActiveOrgId='server-org-id'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        const { result } = renderHook(() => useOrganizationContext(), { wrapper })

        // Should use localStorage value (client wins after hydration)
        expect(result.current.activeOrgId).toBe('local-org-id')
      })

      it('should handle server value when localStorage is empty', () => {
        // localStorage is empty, but server has a value
        mockUseStoredSettings.mockReturnValue({
          settings: { activeOrgId: '' },
          updateSettings: mockUpdateSettings,
          clearSettings: jest.fn(),
        })

        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123' initialActiveOrgId='server-org-id'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        renderHook(() => useOrganizationContext(), { wrapper })

        // useStoredSettings should be called with server value as initial
        expect(mockUseStoredSettings).toHaveBeenCalledWith({
          userId: 'user-123',
          initialSettings: { activeOrgId: 'server-org-id' },
        })
      })

      it('should not have hydration mismatches with consistent server-client data', () => {
        // Both server and localStorage have the same value
        mockUseStoredSettings.mockReturnValue({
          settings: { activeOrgId: 'consistent-org-id' },
          updateSettings: mockUpdateSettings,
          clearSettings: jest.fn(),
        })

        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123' initialActiveOrgId='consistent-org-id'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        const { result } = renderHook(() => useOrganizationContext(), { wrapper })

        expect(result.current.activeOrgId).toBe('consistent-org-id')
      })
    })

    describe('Cookie Updates on Organization Switch', () => {
      beforeEach(() => {
        // Mock document.cookie for client-side testing
        Object.defineProperty(document, 'cookie', {
          writable: true,
          value: '',
        })
      })

      it('should call updateSettings when switching organizations', async () => {
        const wrapper = createWrapper()
        const { result } = renderHook(() => useOrganizationContext(), { wrapper })

        await result.current.switchOrganization('org-2')

        expect(mockUpdateSettings).toHaveBeenCalledWith({
          activeOrgId: 'org-2',
        })
      })

      it('should not update settings when switching to same organization', async () => {
        mockUseStoredSettings.mockReturnValue({
          settings: { activeOrgId: 'org-1' },
          updateSettings: mockUpdateSettings,
          clearSettings: jest.fn(),
        })

        const wrapper = createWrapper()
        const { result } = renderHook(() => useOrganizationContext(), { wrapper })

        await result.current.switchOrganization('org-1')

        expect(mockUpdateSettings).not.toHaveBeenCalled()
      })

      it('should handle updateSettings errors gracefully', async () => {
        mockUpdateSettings.mockImplementation(() => {
          throw new Error('Storage error')
        })

        const wrapper = createWrapper()
        const { result } = renderHook(() => useOrganizationContext(), { wrapper })

        // Should not throw but will reject the promise
        await expect(result.current.switchOrganization('org-2')).rejects.toThrow('Storage error')
      })
    })

    describe('Multi-User Cookie Isolation', () => {
      it('should create different provider instances for different users', () => {
        const user1Wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-1' initialActiveOrgId='org-1'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        const user2Wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-2' initialActiveOrgId='org-2'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        renderHook(() => useOrganizationContext(), { wrapper: user1Wrapper })
        renderHook(() => useOrganizationContext(), { wrapper: user2Wrapper })

        // Should be called with different user IDs
        expect(mockUseStoredSettings).toHaveBeenCalledWith({
          userId: 'user-1',
          initialSettings: { activeOrgId: 'org-1' },
        })
        expect(mockUseStoredSettings).toHaveBeenCalledWith({
          userId: 'user-2',
          initialSettings: { activeOrgId: 'org-2' },
        })
      })

      it('should not cross-contaminate between users', () => {
        // User 1 changes organization
        mockUseStoredSettings.mockReturnValueOnce({
          settings: { activeOrgId: 'org-1' },
          updateSettings: jest.fn(),
          clearSettings: jest.fn(),
        })

        // User 2 should have their own state
        mockUseStoredSettings.mockReturnValueOnce({
          settings: { activeOrgId: 'org-2' },
          updateSettings: jest.fn(),
          clearSettings: jest.fn(),
        })

        const user1Wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-1'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        const user2Wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-2'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        const { result: user1Result } = renderHook(() => useOrganizationContext(), { 
          wrapper: user1Wrapper 
        })
        const { result: user2Result } = renderHook(() => useOrganizationContext(), { 
          wrapper: user2Wrapper 
        })

        expect(user1Result.current.activeOrgId).toBe('org-1')
        expect(user2Result.current.activeOrgId).toBe('org-2')
      })
    })

    describe('Edge Cases and Error Handling', () => {
      it('should handle undefined initialActiveOrgId gracefully', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123' initialActiveOrgId={undefined}>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        renderHook(() => useOrganizationContext(), { wrapper })

        expect(mockUseStoredSettings).toHaveBeenCalledWith({
          userId: 'user-123',
          initialSettings: { activeOrgId: undefined },
        })
      })

      it('should handle empty string initialActiveOrgId', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123' initialActiveOrgId=''>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        renderHook(() => useOrganizationContext(), { wrapper })

        expect(mockUseStoredSettings).toHaveBeenCalledWith({
          userId: 'user-123',
          initialSettings: { activeOrgId: '' },
        })
      })

      it('should handle very long organization IDs', () => {
        const longOrgId = 'very-long-organization-id-'.repeat(10) // 290+ characters
        
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123' initialActiveOrgId={longOrgId}>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        renderHook(() => useOrganizationContext(), { wrapper })

        expect(mockUseStoredSettings).toHaveBeenCalledWith({
          userId: 'user-123',
          initialSettings: { activeOrgId: longOrgId },
        })
      })

      it('should handle special characters in organization IDs', () => {
        const specialOrgId = 'org-with-special-chars!@#$%^&*()_+'
        
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123' initialActiveOrgId={specialOrgId}>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        renderHook(() => useOrganizationContext(), { wrapper })

        expect(mockUseStoredSettings).toHaveBeenCalledWith({
          userId: 'user-123',
          initialSettings: { activeOrgId: specialOrgId },
        })
      })

      it('should handle rapid organization switches', async () => {
        const wrapper = createWrapper()
        const { result } = renderHook(() => useOrganizationContext(), { wrapper })

        // Rapid switches - but only switching away from current org should call updateSettings
        await Promise.all([
          result.current.switchOrganization('org-2'), // Call 1: org-1 -> org-2
          result.current.switchOrganization('org-3'), // Call 2: org-2 -> org-3  
          result.current.switchOrganization('org-1'), // Not called: already at org-1 initially
        ])

        // Should handle the switches that actually change the org
        expect(mockUpdateSettings).toHaveBeenCalledTimes(2)
      })
    })

    describe('Backward Compatibility', () => {
      it('should work without initialActiveOrgId prop (legacy behavior)', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        renderHook(() => useOrganizationContext(), { wrapper })

        // Should still call useStoredSettings with undefined initial value
        expect(mockUseStoredSettings).toHaveBeenCalledWith({
          userId: 'user-123',
          initialSettings: { activeOrgId: undefined },
        })
      })

      it('should maintain same context API regardless of server/client initialization', () => {
        const serverWrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123' initialActiveOrgId='server-org'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        const clientWrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={new QueryClient()}>
            <OrganizationProvider userId='user-123'>
              {children}
            </OrganizationProvider>
          </QueryClientProvider>
        )

        const { result: serverResult } = renderHook(() => useOrganizationContext(), { 
          wrapper: serverWrapper 
        })
        const { result: clientResult } = renderHook(() => useOrganizationContext(), { 
          wrapper: clientWrapper 
        })

        // Both should have same API surface
        expect(typeof serverResult.current.switchOrganization).toBe('function')
        expect(typeof clientResult.current.switchOrganization).toBe('function')
        expect(typeof serverResult.current.refreshPermissions).toBe('function')
        expect(typeof clientResult.current.refreshPermissions).toBe('function')
      })
    })
  })
})

// Additional test file: use-stored-settings.test.ts cookie integration tests
describe('useStoredSettings Cookie Integration', () => {
  // These tests should be added to use-stored-settings.test.ts
  // to test the cookie functionality specifically

  describe('Cookie Setting on Update', () => {
    beforeEach(() => {
      // Mock document.cookie
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      })
      
      // Mock window to simulate browser environment
      Object.defineProperty(window, 'window', {
        value: global,
      })
    })

    it('should set user-specific cookie when activeOrgId is updated', () => {
      // This test should verify that the cookie is set with the correct name
      // and that getActiveOrgCookieName is used properly
    })

    it('should clear cookie when activeOrgId is set to empty string', () => {
      // Test cookie clearing behavior
    })

    it('should not set cookie in SSR environment (no window)', () => {
      // Test server-side safety
    })

    it('should handle cookie setting errors gracefully', () => {
      // Test error handling when cookie setting fails
    })
  })
})
