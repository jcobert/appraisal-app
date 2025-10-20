'use client'

import { Organization } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { sortBy } from 'lodash'
import {
  FC,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'

import { usePermissions } from '@/hooks/use-permissions'
import { useStoredSettings } from '@/hooks/use-stored-settings'

import { SessionUser } from '@/types/auth'

import { PermissionAction } from '@/configuration/permissions'
import { permissionsQueryKey } from '@/configuration/react-query/query-keys'
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
  /** Active session user ID. */
  userId: SessionUser['id']
  /** Optional initial organizations data. */
  initialOrganizations?: Organization[]
  /** Initial active organization ID from server (cookie). */
  initialActiveOrgId?: string
}

export const OrganizationProvider: FC<OrganizationProviderProps> = ({
  children,
  userId,
  initialOrganizations = [],
  initialActiveOrgId,
}) => {
  const {
    settings: { activeOrgId },
    updateSettings,
  } = useStoredSettings({
    userId,
    initialSettings: { activeOrgId: initialActiveOrgId },
  })

  // Use the activeOrgId from settings (which now includes the initial server value)
  const effectiveActiveOrgId = activeOrgId

  const queryClient = useQueryClient()

  const { response, isLoading: isLoadingOrganizations } = useGetOrganizations({
    options: { enabled: !!userId },
  })
  const organizations = response?.data || initialOrganizations

  const { response: activeOrgRes } = useGetOrganizations({
    id: effectiveActiveOrgId,
    options: { enabled: !!effectiveActiveOrgId && !!userId },
  })
  const fetchedActiveOrg = activeOrgRes?.data

  // Validate stored org is still accessible to current user
  const isStoredOrgValid = useMemo(() => {
    if (!effectiveActiveOrgId || !organizations?.length) return false
    return organizations?.some((org) => org?.id === effectiveActiveOrgId)
  }, [effectiveActiveOrgId, organizations])

  // Clear invalid stored org
  useEffect(() => {
    if (
      effectiveActiveOrgId &&
      (!organizations?.length || (organizations?.length && !isStoredOrgValid))
    ) {
      updateSettings({ activeOrgId: '' })
    }
  }, [effectiveActiveOrgId, organizations, isStoredOrgValid, updateSettings])

  // The fetched org that matches activeOrgId from cookie/local storage.
  // Prioritizes the "find one" org query and falls back to matching org from the "find many" query.
  const selectedOrganization = useMemo(() => {
    if ((!organizations?.length && !fetchedActiveOrg) || !effectiveActiveOrgId)
      return undefined
    if (fetchedActiveOrg?.id === effectiveActiveOrgId) return fetchedActiveOrg
    return organizations?.find((org) => org?.id === effectiveActiveOrgId)
  }, [effectiveActiveOrgId, organizations, fetchedActiveOrg])

  const permissions = usePermissions({
    area: 'organization',
    organizationId: effectiveActiveOrgId || '',
  })

  const switchOrganization = useCallback(
    async (newOrgId: string) => {
      if (newOrgId === effectiveActiveOrgId) return

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
    [effectiveActiveOrgId, updateSettings, queryClient],
  )

  const refreshPermissions = useCallback(async () => {
    if (!effectiveActiveOrgId) return

    await queryClient.invalidateQueries({
      queryKey: permissionsQueryKey.filtered({
        area: 'organization',
        organizationId: effectiveActiveOrgId,
      }),
      exact: true,
      type: 'all',
      refetchType: 'all',
    })
  }, [queryClient, effectiveActiveOrgId])

  // Auto-select first organization if none is selected or stored org is invalid
  useEffect(() => {
    if (
      (!effectiveActiveOrgId || !isStoredOrgValid) &&
      !!organizations?.length
    ) {
      const firstOrg = sortBy(organizations, (org) => org?.name)?.[0]
      if (firstOrg) {
        updateSettings({ activeOrgId: firstOrg?.id })
      }
    }
  }, [effectiveActiveOrgId, isStoredOrgValid, organizations, updateSettings])

  const value = useMemo<OrganizationContextValue>(
    () => ({
      activeOrgId: effectiveActiveOrgId,
      selectedOrganization,
      organizations,
      isLoadingOrganizations,
      permissions,
      switchOrganization,
      refreshPermissions,
    }),
    [
      effectiveActiveOrgId,
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
