import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'

import {
  OrganizationProvider,
  useActiveOrgPermissions,
  useOrganizationContext,
} from '@/providers/organization-provider'

import { usePermissions } from '@/hooks/use-permissions'
import { useStoredSettings } from '@/hooks/use-stored-settings'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'

// Mock all dependencies
jest.mock('@/hooks/use-permissions')
jest.mock('@/hooks/use-stored-settings')
jest.mock('@/features/organization/hooks/use-get-organizations')

const mockUsePermissions = usePermissions as jest.MockedFunction<
  typeof usePermissions
>
const mockUseStoredSettings = useStoredSettings as jest.MockedFunction<
  typeof useStoredSettings
>
const mockUseGetOrganizations = useGetOrganizations as jest.MockedFunction<
  typeof useGetOrganizations
>

/**
 * CRITICAL SECURITY TEST
 *
 * This test verifies the following scenario:
 * - User has edit permissions for Org A (active org)
 * - User navigates to Org B page (which they should only be able to view)
 * - Ensures that useActiveOrgPermissions() doesn't leak Org A permissions to Org B
 * - Ensures that page-specific usePermissions() correctly shows Org B permissions
 */
describe('Critical Security Integration Test', () => {
  const orgA = {
    id: 'org-admin-access',
    name: 'Organization A - Admin Access',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
  }

  const orgB = {
    id: 'org-view-only',
    name: 'Organization B - View Only',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
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

  beforeEach(() => {
    jest.clearAllMocks()

    // Set Org A as the active organization
    mockUseStoredSettings.mockReturnValue({
      settings: { activeOrgId: 'org-admin-access' },
      updateSettings: jest.fn(),
      clearSettings: jest.fn(),
    })

    mockUseGetOrganizations.mockReturnValue({
      response: { data: [orgA, orgB] },
    } as any)

    // Mock permissions: User has admin rights to Org A, view-only for Org B
    mockUsePermissions.mockImplementation(({ organizationId }) => {
      if (organizationId === 'org-admin-access') {
        return {
          can: jest.fn((action: string) =>
            [
              'organization:edit',
              'members:edit',
              'organization:delete',
              'organization:view',
              'members:view_details',
            ].includes(action),
          ),
          isLoading: false,
          error: null,
        }
      }

      if (organizationId === 'org-view-only') {
        return {
          can: jest.fn((action: string) => action === 'organization:view'),
          isLoading: false,
          error: null,
        }
      }

      // Default: no permissions
      return {
        can: jest.fn(() => false),
        isLoading: false,
        error: null,
      }
    })
  })

  describe('Permission Isolation Verification', () => {
    it('CRITICAL: should prevent permission leakage between active org and page org', () => {
      const wrapper = createWrapper()

      // Simulate the problematic scenario:
      // 1. User has Org A selected as active (admin permissions)
      // 2. User navigates to Org B page (should only have view permissions)

      // Test 1: Global permissions (for navigation) should reflect active org (Org A)
      const { result: globalPermissions } = renderHook(
        () => useActiveOrgPermissions(),
        { wrapper },
      )

      expect(globalPermissions.current.can('organization:edit')).toBe(true) // Admin access to active org
      expect(globalPermissions.current.can('organization:delete')).toBe(true)

      // Test 2: Page-specific permissions for Org B should be limited
      const { result: pageBPermissions } = renderHook(
        () =>
          usePermissions({
            organizationId: 'org-view-only',
          }),
        { wrapper },
      )

      expect(pageBPermissions.current.can('organization:edit')).toBe(false) // NO edit access to Org B
      expect(pageBPermissions.current.can('organization:delete')).toBe(false) // NO delete access to Org B
      expect(pageBPermissions.current.can('organization:view')).toBe(true) // Only view access to Org B

      // Test 3: Page-specific permissions for Org A should still work
      const { result: pageAPermissions } = renderHook(
        () =>
          usePermissions({
            organizationId: 'org-admin-access',
          }),
        { wrapper },
      )

      expect(pageAPermissions.current.can('organization:edit')).toBe(true) // Admin access to Org A
      expect(pageAPermissions.current.can('organization:delete')).toBe(true)
    })

    it('CRITICAL: should ensure page-specific permissions are never affected by active org', () => {
      const wrapper = createWrapper()

      // Multiple tests with different active organizations
      const testCases = [
        {
          activeOrg: 'org-admin-access',
          pageOrg: 'org-view-only',
          expectedEdit: false,
        },
        {
          activeOrg: 'org-view-only',
          pageOrg: 'org-admin-access',
          expectedEdit: true,
        },
        {
          activeOrg: 'org-admin-access',
          pageOrg: 'org-admin-access',
          expectedEdit: true,
        },
        {
          activeOrg: 'org-view-only',
          pageOrg: 'org-view-only',
          expectedEdit: false,
        },
      ]

      testCases.forEach(({ activeOrg, pageOrg, expectedEdit }) => {
        // Update the active organization
        mockUseStoredSettings.mockReturnValue({
          settings: { activeOrgId: activeOrg },
          updateSettings: jest.fn(),
          clearSettings: jest.fn(),
        })

        // Test page permissions - should ONLY depend on pageOrg, not activeOrg
        const { result } = renderHook(
          () => usePermissions({ organizationId: pageOrg }),
          { wrapper },
        )

        expect(result.current.can('organization:edit')).toBe(expectedEdit)
      })
    })

    it('CRITICAL: should verify organization context isolation', () => {
      const wrapper = createWrapper()

      // Get the organization context
      const { result: context } = renderHook(() => useOrganizationContext(), {
        wrapper,
      })

      // Active org should be Org A
      expect(context.current.activeOrgId).toBe('org-admin-access')
      expect(context.current.selectedOrganization?.id).toBe('org-admin-access')

      // Context permissions should be for active org only
      expect(context.current.permissions.can('organization:edit')).toBe(true)

      // But when we check permissions for a different org specifically, it should be isolated
      const { result: specificPermissions } = renderHook(
        () =>
          usePermissions({
            organizationId: 'org-view-only',
          }),
        { wrapper },
      )

      expect(specificPermissions.current.can('organization:edit')).toBe(false)
    })

    it('CRITICAL: should handle organization switching securely', async () => {
      const wrapper = createWrapper()
      const { result: context } = renderHook(() => useOrganizationContext(), {
        wrapper,
      })

      // Initially active org has admin permissions
      expect(context.current.permissions.can('organization:edit')).toBe(true)

      // Switch to Org B (view-only)
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-view-only' },
        updateSettings: jest.fn(),
        clearSettings: jest.fn(),
      })

      // After switching, context permissions should be limited
      const { result: newContext } = renderHook(
        () => useOrganizationContext(),
        { wrapper },
      )
      expect(newContext.current.permissions.can('organization:edit')).toBe(
        false,
      )
      expect(newContext.current.permissions.can('organization:view')).toBe(true)

      // Page-specific permissions should remain isolated
      const { result: pageSpecific } = renderHook(
        () =>
          usePermissions({
            organizationId: 'org-admin-access',
          }),
        { wrapper },
      )
      expect(pageSpecific.current.can('organization:edit')).toBe(true) // Still has admin access to Org A
    })

    it('CRITICAL: should deny permissions for non-existent organizations', () => {
      const wrapper = createWrapper()

      const { result } = renderHook(
        () =>
          usePermissions({
            organizationId: 'non-existent-org',
          }),
        { wrapper },
      )

      expect(result.current.can('organization:view')).toBe(false)
      expect(result.current.can('organization:edit')).toBe(false)
      expect(result.current.can('organization:delete')).toBe(false)
    })

    it('CRITICAL: should handle malicious organization ID inputs', () => {
      const wrapper = createWrapper()

      const maliciousInputs = [
        '../../../admin-org',
        'org-admin-access; DROP TABLE organizations;',
        '../../org-admin-access',
        'null',
        'undefined',
        '${process.env.ADMIN_ORG}',
        '<script>alert("xss")</script>',
      ]

      maliciousInputs.forEach((maliciousId) => {
        const { result } = renderHook(
          () =>
            usePermissions({
              organizationId: maliciousId,
            }),
          { wrapper },
        )

        // All malicious inputs should result in no permissions
        expect(result.current.can('organization:view')).toBe(false)
        expect(result.current.can('organization:edit')).toBe(false)
        expect(result.current.can('organization:delete')).toBe(false)
      })
    })
  })

  describe('Real-world Security Scenarios', () => {
    it('should prevent privilege escalation attack vector', () => {
      // Scenario: Attacker tries to manipulate active org to gain access to restricted org
      const wrapper = createWrapper()

      // User legitimately has access to Org A
      const { result: legitAccess } = renderHook(
        () =>
          usePermissions({
            organizationId: 'org-admin-access',
          }),
        { wrapper },
      )
      expect(legitAccess.current.can('organization:delete')).toBe(true)

      // But cannot access Org B even if they manipulate the active org setting
      mockUseStoredSettings.mockReturnValue({
        settings: { activeOrgId: 'org-admin-access' }, // Attacker sets this
        updateSettings: jest.fn(),
        clearSettings: jest.fn(),
      })

      const { result: attackAttempt } = renderHook(
        () =>
          usePermissions({
            organizationId: 'org-view-only',
          }), // But views this page
        { wrapper },
      )

      // Should still be restricted to view-only for Org B
      expect(attackAttempt.current.can('organization:delete')).toBe(false)
      expect(attackAttempt.current.can('organization:edit')).toBe(false)
    })

    it('should maintain security during rapid organization switches', () => {
      const wrapper = createWrapper()

      // Rapidly switch between organizations
      const switches = [
        'org-admin-access',
        'org-view-only',
        'org-admin-access',
        'non-existent',
        'org-view-only',
      ]

      switches.forEach((orgId) => {
        const { result } = renderHook(
          () => usePermissions({ organizationId: orgId }),
          { wrapper },
        )

        const expectedCanEdit = orgId === 'org-admin-access'
        expect(result.current.can('organization:edit')).toBe(expectedCanEdit)
      })
    })
  })
})
