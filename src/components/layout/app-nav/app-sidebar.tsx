import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { FC } from 'react'

import { getSessionData } from '@/lib/db/utils'
import { handleGetUserOrganizations } from '@/lib/db/handlers/organization-handlers'
import { handleGetActiveUser } from '@/lib/db/handlers/user-handlers'

import { createQueryClient } from '@/utils/query'
import { successful } from '@/utils/fetch'

import AppSidebarCore from '@/components/layout/app-nav/app-sidebar-core'

import { organizationsQueryKey } from '@/features/organization/hooks/use-get-organizations'
import { usersQueryKey } from '@/features/user/hooks/use-get-user-profile'

const AppSidebar: FC = async () => {
  const sessionData = await getSessionData()
  const queryClient = createQueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: usersQueryKey.active,
      queryFn: async () => {
        const result = await handleGetActiveUser()
        if (!successful(result.status)) {
          throw new Error(result.error?.message || 'Failed to fetch active user')
        }
        return result
      },
    }),
    queryClient.prefetchQuery({
      queryKey: organizationsQueryKey.all,
      queryFn: async () => {
        const result = await handleGetUserOrganizations()
        if (!successful(result.status)) {
          throw new Error(result.error?.message || 'Failed to fetch organizations')
        }
        return result
      },
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AppSidebarCore sessionData={sessionData} />
    </HydrationBoundary>
  )
}

export default AppSidebar
