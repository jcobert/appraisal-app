import { useCallback } from 'react'

import { Organization } from '@repo/database'
import { exists } from '@repo/utils'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { GetOrganizationPermissionsResult } from '@/lib/db/handlers/organization-handlers'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

import { PermissionAction, PermissionArea } from '@/configuration/permissions'
import { permissionsQueryKey } from '@/configuration/react-query/query-keys'

type UsePermissionsReturn<Area extends PermissionArea> = {
  can: (action: PermissionAction[Area]) => boolean
  isLoading: boolean
  error: Error | null
}

type Props<Area extends PermissionArea> = {
  /** The area of the application to check permissions for. */
  area: Area
  /** The organization ID to check permissions against. */
  organizationId: Organization['id']
  /** Additional query options. */
  options?: Partial<UseCoreQueryProps<GetOrganizationPermissionsResult['data']>>
}

/**
 * Hook for checking permissions in a specific area of the application.
 */
export const usePermissions = <Area extends PermissionArea>({
  area,
  organizationId,
  options,
}: Props<Area>): UsePermissionsReturn<Area> => {
  const { response, isLoading, error } = useCoreQuery<
    GetOrganizationPermissionsResult['data']
  >({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/permissions`,
    queryKey: permissionsQueryKey.filtered({ organizationId, area }),
    enabled: exists(organizationId),
    staleTime: 1000 * 60 * 60,
    ...options,
  })

  const can = useCallback(
    (action: PermissionAction[Area]): boolean => {
      // Return false while loading or if there's an error.
      // This ensures UI elements requiring permissions stay hidden until we're certain.
      if (isLoading || error) return false
      return response?.data?.[area]?.includes(action) ?? false
    },
    [response?.data, area, isLoading, error],
  )

  return { can, isLoading, error }
}
