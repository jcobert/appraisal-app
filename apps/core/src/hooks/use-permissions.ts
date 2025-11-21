import { useCallback } from 'react'

import { Organization } from '@repo/database'
import { exists } from '@repo/utils'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { GetOrganizationPermissionsResult } from '@/lib/db/handlers/organization-handlers'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

import { PermissionAction } from '@/configuration/permissions'
import { permissionsQueryKey } from '@/configuration/react-query/query-keys'

type UsePermissionsReturn = {
  can: (action: PermissionAction) => boolean
  isLoading: boolean
  error: Error | null
}

type Props = {
  /** The organization ID to check permissions against. */
  organizationId: Organization['id']
  /** Additional query options. */
  options?: Partial<UseCoreQueryProps<GetOrganizationPermissionsResult['data']>>
}

/**
 * Hook for checking permissions for a specific organization.
 * All permissions are scoped to organizations.
 */
export const usePermissions = ({
  organizationId,
  options,
}: Props): UsePermissionsReturn => {
  const { response, isLoading, error } = useCoreQuery<
    GetOrganizationPermissionsResult['data']
  >({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/permissions`,
    queryKey: permissionsQueryKey.filtered({ organizationId }),
    enabled: exists(organizationId),
    staleTime: 1000 * 60 * 60,
    ...options,
  })

  const can = useCallback(
    (action: PermissionAction): boolean => {
      // Return false while loading or if there's an error.
      // This ensures UI elements requiring permissions stay hidden until we're certain.
      if (isLoading || error) return false
      return response?.data?.includes(action) ?? false
    },
    [response?.data, isLoading, error],
  )

  return { can, isLoading, error }
}
