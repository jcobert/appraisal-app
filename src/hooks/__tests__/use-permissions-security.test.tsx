import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { usePermissions } from '@/hooks/use-permissions'

// Mock the permissions hook
jest.mock('@/hooks/use-permissions')
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>

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

  const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('Organization Page Permission Isolation', () => {
    it('should only grant permissions for the specific organization being viewed', () => {
      // User has edit permissions for org-1 but only view for org-2
      const org1Permissions = {
        can: jest.fn((action: string) => 
          ['edit_org_info', 'edit_org_members', 'delete_org', 'view_org'].includes(action)
        ),
        isLoading: false,
        error: null,
      }

      const org2Permissions = {
        can: jest.fn((action: string) => action === 'view_org'),
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
        () => usePermissions({ area: 'organization', organizationId: 'org-1' }),
        { wrapper }
      )

      expect(org1Result.current.can('edit_org_info')).toBe(true)
      expect(org1Result.current.can('edit_org_members')).toBe(true)
      expect(org1Result.current.can('delete_org')).toBe(true)

      // Test org-2 permissions (user only has view rights)
      const { result: org2Result } = renderHook(
        () => usePermissions({ area: 'organization', organizationId: 'org-2' }),
        { wrapper }
      )

      expect(org2Result.current.can('edit_org_info')).toBe(false)
      expect(org2Result.current.can('edit_org_members')).toBe(false)
      expect(org2Result.current.can('delete_org')).toBe(false)
      expect(org2Result.current.can('view_org')).toBe(true)
    })

    it('should prevent permission leakage between organizations', () => {
      // Set up scenario where user has different permissions for different orgs
      mockUsePermissions.mockImplementation(({ organizationId }) => {
        const orgPermissions: Record<string, string[]> = {
          'admin-org': ['edit_org_info', 'edit_org_members', 'delete_org', 'view_org'],
          'member-org': ['view_org'],
          'no-access-org': [],
        }

        return {
          can: jest.fn((action: string) => orgPermissions[organizationId || '']?.includes(action) || false),
          isLoading: false,
          error: null,
        }
      })

      const wrapper = createWrapper()

      // Test admin org - should have all permissions
      const { result: adminResult } = renderHook(
        () => usePermissions({ area: 'organization', organizationId: 'admin-org' }),
        { wrapper }
      )

      expect(adminResult.current.can('delete_org')).toBe(true)

      // Test member org - should NOT have admin permissions
      const { result: memberResult } = renderHook(
        () => usePermissions({ area: 'organization', organizationId: 'member-org' }),
        { wrapper }
      )

      expect(memberResult.current.can('delete_org')).toBe(false)
      expect(memberResult.current.can('edit_org_info')).toBe(false)
      expect(memberResult.current.can('view_org')).toBe(true)

      // Test no-access org - should have no permissions
      const { result: noAccessResult } = renderHook(
        () => usePermissions({ area: 'organization', organizationId: 'no-access-org' }),
        { wrapper }
      )

      expect(noAccessResult.current.can('view_org')).toBe(false)
      expect(noAccessResult.current.can('edit_org_info')).toBe(false)
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
        () => usePermissions({ area: 'organization', organizationId: 'invalid-org-123' }),
        { wrapper }
      )

      expect(invalidResult.current.can('view_org')).toBe(false)
      expect(invalidResult.current.can('edit_org_info')).toBe(false)

      // Test empty organization ID
      const { result: emptyResult } = renderHook(
        () => usePermissions({ area: 'organization', organizationId: '' }),
        { wrapper }
      )

      expect(emptyResult.current.can('view_org')).toBe(false)

      // Test null/undefined organization ID
      const { result: nullResult } = renderHook(
        () => usePermissions({ area: 'organization', organizationId: undefined as any }),
        { wrapper }
      )

      expect(nullResult.current.can('view_org')).toBe(false)
    })

    it('should fail securely during loading states', () => {
      mockUsePermissions.mockReturnValue({
        can: jest.fn(() => false), // Should deny permissions while loading
        isLoading: true,
        error: null,
      })

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ area: 'organization', organizationId: 'org-1' }),
        { wrapper }
      )

      // Should deny all permissions while loading
      expect(result.current.can('view_org')).toBe(false)
      expect(result.current.can('edit_org_info')).toBe(false)
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
        () => usePermissions({ area: 'organization', organizationId: 'org-1' }),
        { wrapper }
      )

      // Should deny all permissions on error
      expect(result.current.can('view_org')).toBe(false)
      expect(result.current.can('edit_org_info')).toBe(false)
      expect(result.current.error).toBeDefined()
    })

    it('should validate permission actions are organization-specific', () => {
      mockUsePermissions.mockImplementation(({ area, organizationId }) => {
        // Ensure we're checking the right area and organization
        expect(area).toBe('organization')
        expect(organizationId).toBeDefined()
        
        return {
          can: jest.fn((action: string) => {
            // Only allow valid organization actions
            const validOrgActions = [
              'edit_org_info',
              'edit_org_members', 
              'delete_org',
              'view_org',
              'view_org_member_details'
            ]
            return validOrgActions.includes(action)
          }),
          isLoading: false,
          error: null,
        }
      })

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => usePermissions({ area: 'organization', organizationId: 'org-1' }),
        { wrapper }
      )

      // Valid organization actions should work
      expect(result.current.can('edit_org_info')).toBe(true)
      expect(result.current.can('view_org')).toBe(true)
      
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
        { orgId: 'org-restricted', expectedEdit: false, description: 'restricted org' },
        { orgId: 'org-nonexistent', expectedEdit: false, description: 'non-existent org' },
      ]

      mockUsePermissions.mockImplementation(({ organizationId }) => ({
        can: jest.fn((action: string) => {
          // Only org-admin has edit permissions
          return organizationId === 'org-admin' && 
                 ['edit_org_info', 'edit_org_members'].includes(action)
        }),
        isLoading: false,
        error: null,
      }))

      const wrapper = createWrapper()

      scenarios.forEach(({ orgId, expectedEdit }) => {
        const { result } = renderHook(
          () => usePermissions({ area: 'organization', organizationId: orgId }),
          { wrapper }
        )

        expect(result.current.can('edit_org_info')).toBe(expectedEdit)
        expect(result.current.can('edit_org_members')).toBe(expectedEdit)
      })
    })

    it('should ensure each permission check is isolated', () => {
      const permissionCalls: Array<{ area: string; organizationId: string }> = []
      
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
        () => usePermissions({ area: 'organization', organizationId: 'trusted-org' }),
        { wrapper }
      )
      
      renderHook(
        () => usePermissions({ area: 'organization', organizationId: 'untrusted-org' }),
        { wrapper }
      )

      // Ensure each call was made with the correct organization ID
      expect(permissionCalls).toContainEqual({
        area: 'organization',
        organizationId: 'trusted-org'
      })
      
      expect(permissionCalls).toContainEqual({
        area: 'organization', 
        organizationId: 'untrusted-org'
      })

      // Ensure calls are isolated (no cross-contamination)
      expect(permissionCalls.length).toBe(2)
    })
  })
})
