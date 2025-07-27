'use client'

import { Organization } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'

import { permissionsQueryKey, usePermissions } from '@/hooks/use-permissions'
import { useStoredSettings } from '@/hooks/use-stored-settings'

import { PermissionAction } from '@/configuration/permissions'
import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'

type OrganizationContextValue = {
  /** The currently active organization ID. */
  activeOrgId: string | undefined
  /** The currently active organization object. */
  selectedOrganization: Organization | undefined
  /** All available organizations. */
  organizations: Organization[]
  /** Loading state for organizations. */
  isLoadingOrganizations: boolean
  /** Current user's permissions for the active organization. */
  permissions: {
    can: (action: PermissionAction['organization']) => boolean
    isLoading: boolean
    error: Error | null
  }
  /** Switch to a different organization. */
  switchOrganization: (orgId: string) => Promise<void>
  /** Refresh permissions for the current organization. */
  refreshPermissions: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null)

type OrganizationProviderProps = {
  children: React.ReactNode
  /** Optional initial organizations data. */
  initialOrganizations?: Organization[]
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({
  children,
  initialOrganizations = [],
}) => {
  const {
    settings: { activeOrgId },
    updateSettings,
  } = useStoredSettings()
  const queryClient = useQueryClient()

  const { response, isLoading: isLoadingOrganizations } = useGetOrganizations()
  const organizations = response?.data || initialOrganizations

  const selectedOrganization = useMemo(() => {
    if (!organizations?.length || !activeOrgId) return undefined
    return organizations.find((org) => org.id === activeOrgId)
  }, [activeOrgId, organizations])

  const permissions = usePermissions({
    area: 'organization',
    organizationId: activeOrgId || '',
  })

  const switchOrganization = useCallback(
    async (newOrgId: string) => {
      if (newOrgId === activeOrgId) return

      // Update the active org in settings
      updateSettings({ activeOrgId: newOrgId })

      // Invalidate and refetch permissions for the new org
      await queryClient.invalidateQueries({
        queryKey: permissionsQueryKey.filtered({
          area: 'organization',
          organizationId: newOrgId,
        }),
        exact: true,
        type: 'all',
        refetchType: 'all',
      })
    },
    [activeOrgId, updateSettings, queryClient],
  )

  const refreshPermissions = useCallback(async () => {
    if (!activeOrgId) return

    await queryClient.invalidateQueries({
      queryKey: permissionsQueryKey.filtered({
        area: 'organization',
        organizationId: activeOrgId,
      }),
      exact: true,
      type: 'all',
      refetchType: 'all',
    })
  }, [queryClient, activeOrgId])

  // Auto-select first organization if none is selected
  useEffect(() => {
    if (!activeOrgId && organizations.length > 0) {
      const firstOrg = organizations[0]
      if (firstOrg) {
        updateSettings({ activeOrgId: firstOrg.id })
      }
    }
  }, [activeOrgId, organizations, updateSettings])

  const value = useMemo<OrganizationContextValue>(
    () => ({
      activeOrgId,
      selectedOrganization,
      organizations,
      isLoadingOrganizations,
      permissions,
      switchOrganization,
      refreshPermissions,
    }),
    [
      activeOrgId,
      selectedOrganization,
      organizations,
      isLoadingOrganizations,
      permissions,
      switchOrganization,
      refreshPermissions,
    ],
  )

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

/**
 * Hook to access the organization context.
 * Must be used within an OrganizationProvider.
 */
export const useOrganizationContext = (): OrganizationContextValue => {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error(
      'useOrganizationContext must be used within an OrganizationProvider',
    )
  }
  return context
}

/**
 * Hook to get permissions for the currently active organization.
 *
 * ⚠️ SECURITY NOTE: This hook returns permissions for the active organization
 * (the one selected in the sidebar), NOT necessarily the organization being
 * viewed on the current page.
 *
 * Use this for:
 * - Navigation menus and sidebars
 * - Global actions that apply to the active org
 * - UI elements that should reflect the user's current working context
 *
 * For page-specific permissions, use `usePermissions({ organizationId })` instead.
 *
 * @example
 * ```tsx
 * // ✅ Good: Navigation component
 * const Sidebar = () => {
 *   const { can } = useActiveOrgPermissions()
 *   return <nav>{can('edit_org_info') && <CreateButton />}</nav>
 * }
 *
 * // ❌ Bad: Organization page component
 * const OrgPage = ({ orgId }) => {
 *   const { can } = useActiveOrgPermissions() // WRONG! Could be different org
 *   return <div>{can('edit_org_info') && <EditButton />}</div>
 * }
 *
 * // ✅ Good: Organization page component
 * const OrgPage = ({ orgId }) => {
 *   const { can } = usePermissions({ area: 'organization', organizationId: orgId })
 *   return <div>{can('edit_org_info') && <EditButton />}</div>
 * }
 * ```
 */
export const useActiveOrgPermissions = () => {
  const { permissions } = useOrganizationContext()
  return permissions
}
