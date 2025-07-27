import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { FC } from 'react'

import { getUserOrganizations } from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'
import { getSessionData } from '@/lib/db/utils'

import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

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
        const data = await getActiveUserProfile()
        return { data } satisfies FetchResponse
      },
    }),
    queryClient.prefetchQuery({
      queryKey: organizationsQueryKey.all,
      queryFn: async () => {
        const data = await getUserOrganizations()
        return { data } satisfies FetchResponse
      },
    }),
  ])

  const queryState = dehydrate(queryClient)

  return (
    <HydrationBoundary state={queryState}>
      <AppSidebarCore sessionData={sessionData} />
    </HydrationBoundary>
  )
}

export default AppSidebar
