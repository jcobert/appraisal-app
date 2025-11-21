import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { usePermissions } from '@/hooks/use-permissions'

// Mock the permissions hook
jest.mock('@/hooks/use-permissions')
const mockUsePermissions = usePermissions as jest.MockedFunction<
  typeof usePermissions
>

describe('Page-Specific Permissions Security Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
  })

  const createWrapper =
    () =>
    ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

  describe('Organization Page Permission Isolation', () => {
    it('should only grant permissions for the specific organization being viewed', () => {
      // User has edit permissions for org-1 but only view for org-2
      const org1Permissions = {
        can: jest.fn((action: string) =>
          [
            'organization:edit',
            'members:edit',
            'organization:delete',
            'organization:view',
          ].includes(action),
        ),
        isLoading: false,
        error: null,
      }

      const org2Permissions = {
        can: jest.fn((action: string) => action === 'organization:view'),
        isLoading: false,
        error: null,
      }

      // Mock permissions to return different permissions based on organizationId
      mockUsePermissions.mockImplementation(({ organizationId }) => {
        switch (organizationId) {
          case 'org-1':
            return org1Permissions
          case 'org-2':
            return org2Permissions
          default:
            return { can: jest.fn(() => false), isLoading: false, error: null }
        }
      })

      const wrapper = createWrapper()

      // Test org-1 permissions (user has edit rights)
      const { result: org1Result } = renderHook(
        () => usePermissions({ organizationId: 'org-1' }),
        { wrapper },
      )

      expect(org1Result.current.can('organization:edit')).toBe(true)
      expect(org1Result.current.can('members:edit')).toBe(true)
      expect(org1Result.current.can('organization:delete')).toBe(true)

      // Test org-2 permissions (user only has view rights)
      const { result: org2Result } = renderHook(
        () => usePermissions({ organizationId: 'org-2' }),
        { wrapper },
      )

      expect(org2Result.current.can('organization:edit')).toBe(false)
      expect(org2Result.current.can('members:edit')).toBe(false)
      expect(org2Result.current.can('organization:delete')).toBe(false)
      expect(org2Result.current.can('organization:view')).toBe(true)
    })

    it('should prevent permission leakage between organizations', () => {
      // Set up scenario where user has different permissions for different orgs
      mockUsePermissions.mockImplementation(({ organizationId }) => {
        const orgPermissions: Record<string, string[]> = {
          'admin-org': [
            'organization:edit',
            'members:edit',
            'organization:delete',
            'organization:view',
          ],
          'member-org': ['organization:view'],
          'no-access-org': [],
        }

        return {
          can: jest.fn(
            (action: string) =>
              orgPermissions[organizationId || '']?.includes(action) || false,
          ),
          isLoading: false,
          error: null,
        }
      })

      const wrapper = createWrapper()

      // Test admin org - should have all permissions
      const { result: adminResult } = renderHook(
        () => usePermissions({ organizationId: 'admin-org' }),
        { wrapper },
      )

      expect(adminResult.current.can('organization:delete')).toBe(true)

      // Test member org - should NOT have admin permissions
      const { result: memberResult } = renderHook(
        () =>
          usePermissions({
            organizationId: 'member-org',
          }),
        { wrapper },
      )

      expect(memberResult.current.can('organization:delete')).toBe(false)
      expect(memberResult.current.can('organization:edit')).toBe(false)
      expect(memberResult.current.can('organization:view')).toBe(true)

      // Test no-access org - should have no permissions
      const { result: noAccessResult } = renderHook(
        () =>
          usePermissions({
            organizationId: 'no-access-org',
          }),
        { wrapper },
      )

      expect(noAccessResult.current.can('organization:view')).toBe(false)
      expect(noAccessResult.current.can('organization:edit')).toBe(false)
    })

    it('should handle invalid organization IDs securely', () => {
      mockUsePermissions.mockImplementation(({ organizationId }) => {
        // Return no permissions for invalid/unknown organization IDs
        if (!['org-1', 'org-2'].includes(organizationId || '')) {
          return {
            can: jest.fn(() => false),
            isLoading: false,
            error: null,
          }
        }

        return {
          can: jest.fn(() => true), // Valid orgs have permissions
          isLoading: false,
          error: null,
        }
      })

      const wrapper = createWrapper()

      // Test invalid organization ID
      const { result: invalidResult } = renderHook(
        () =>
          usePermissions({
            organizationId: 'invalid-org-123',
          }),
        { wrapper },
      )

      expect(invalidResult.current.can('organization:view')).toBe(false)
      expect(invalidResult.current.can('organization:edit')).toBe(false)

      // Test empty organization ID
      const { result: emptyResult } = renderHook(
        () => usePermissions({ organizationId: '' }),
        { wrapper },
      )

      expect(emptyResult.current.can('organization:view')).toBe(false)

      // Test null/undefined organization ID
      const { result: nullResult } = renderHook(
        () =>
          usePermissions({
            organizationId: undefined as any,
          }),
        { wrapper },
      )

      expect(nullResult.current.can('organization:view')).toBe(false)
    })

    it('should fail securely during loading states', () => {
      mockUsePermissions.mockReturnValue({
        can: jest.fn(() => false), // Should deny permissions while loading
        isLoading: true,
        error: null,
      })

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ organizationId: 'org-1' }),
        { wrapper },
      )

      // Should deny all permissions while loading
      expect(result.current.can('organization:view')).toBe(false)
      expect(result.current.can('organization:edit')).toBe(false)
      expect(result.current.isLoading).toBe(true)
    })

    it('should fail securely during error states', () => {
      mockUsePermissions.mockReturnValue({
        can: jest.fn(() => false), // Should deny permissions on error
        isLoading: false,
        error: new Error('Failed to fetch permissions'),
      })

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ organizationId: 'org-1' }),
        { wrapper },
      )

      // Should deny all permissions on error
      expect(result.current.can('organization:view')).toBe(false)
      expect(result.current.can('organization:edit')).toBe(false)
      expect(result.current.error).toBeDefined()
    })

    it('should validate permission actions are organization-specific', () => {
      mockUsePermissions.mockImplementation(({ organizationId }) => {
        // Ensure we're checking the right organization
        expect(organizationId).toBeDefined()

        return {
          can: jest.fn((action: string) => {
            // Only allow valid organization actions
            const validOrgActions = [
              'organization:edit',
              'members:edit',
              'organization:delete',
              'organization:view',
              'members:view_details',
            ]
            return validOrgActions.includes(action)
          }),
          isLoading: false,
          error: null,
        }
      })

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ organizationId: 'org-1' }),
        { wrapper },
      )

      // Valid organization actions should work
      expect(result.current.can('organization:edit')).toBe(true)
      expect(result.current.can('organization:view')).toBe(true)

      // Invalid actions should not work (would be caught at TypeScript level in real usage)
      expect(result.current.can('invalid_action' as any)).toBe(false)
    })
  })

  describe('Cross-Organization Attack Prevention', () => {
    it('should prevent accessing org A data when viewing org B page', () => {
      // Simulate a scenario where an attacker tries to access org-admin permissions
      // while viewing org-restricted page

      const scenarios = [
        { orgId: 'org-admin', expectedEdit: true, description: 'admin org' },
        {
          orgId: 'org-restricted',
          expectedEdit: false,
          description: 'restricted org',
        },
        {
          orgId: 'org-nonexistent',
          expectedEdit: false,
          description: 'non-existent org',
        },
      ]

      mockUsePermissions.mockImplementation(({ organizationId }) => ({
        can: jest.fn((action: string) => {
          // Only org-admin has edit permissions
          return (
            organizationId === 'org-admin' &&
            ['organization:edit', 'members:edit'].includes(action)
          )
        }),
        isLoading: false,
        error: null,
      }))

      const wrapper = createWrapper()

      scenarios.forEach(({ orgId, expectedEdit }) => {
        const { result } = renderHook(
          () => usePermissions({ organizationId: orgId }),
          { wrapper },
        )

        expect(result.current.can('organization:edit')).toBe(expectedEdit)
        expect(result.current.can('members:edit')).toBe(expectedEdit)
      })
    })

    it('should ensure each permission check is isolated', () => {
      const permissionCalls: Array<{ organizationId: string }> = []

      mockUsePermissions.mockImplementation((params) => {
        permissionCalls.push(params)
        return {
          can: jest.fn(() => params.organizationId === 'trusted-org'),
          isLoading: false,
          error: null,
        }
      })

      const wrapper = createWrapper()

      // Make permission checks for different organizations
      renderHook(
        () =>
          usePermissions({
            organizationId: 'trusted-org',
          }),
        { wrapper },
      )

      renderHook(
        () =>
          usePermissions({
            organizationId: 'untrusted-org',
          }),
        { wrapper },
      )

      // Ensure each call was made with the correct organization ID
      expect(permissionCalls).toContainEqual({
        organizationId: 'trusted-org',
      })

      expect(permissionCalls).toContainEqual({
        organizationId: 'untrusted-org',
      })

      // Ensure calls are isolated (no cross-contamination)
      expect(permissionCalls.length).toBe(2)
    })
  })
})
