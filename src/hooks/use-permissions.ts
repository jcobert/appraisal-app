import { Organization } from '@prisma/client'
import { useCallback } from 'react'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { exists } from '@/utils/general'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

import { PermissionAction, PermissionArea } from '@/configuration/permissions'
import { permissionsQueryKey } from '@/configuration/react-query/query-keys'

type UsePermissionsReturn<Area extends PermissionArea> = {
  can: (action: PermissionAction[Area]) => boolean
  isLoading: boolean
  error: Error | null
}

type PermissionsResponse =
  | { [Area in PermissionArea]: PermissionAction[Area][] }
  | null

type Props<Area extends PermissionArea> = {
  area: Area
  organizationId: Organization['id']
  options?: Partial<UseCoreQueryProps<PermissionsResponse>>
}

/**
 * Hook for checking permissions in a specific area of the application.
 * @param area The area of the application to check permissions for.
 * @param organizationId The organization ID to check permissions against.
 * @param options Additional query options.
 */
export const usePermissions = <Area extends PermissionArea>({
  area,
  organizationId,
  options,
}: Props<Area>): UsePermissionsReturn<Area> => {
  const { response, isLoading, error } = useCoreQuery<PermissionsResponse>({
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
