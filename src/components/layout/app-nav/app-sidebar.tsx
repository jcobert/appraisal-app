import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { FC } from 'react'

import { getActiveUserProfile } from '@/lib/db/queries/user'

import { getSessionData } from '@/utils/auth'
import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import AppSidebarCore from '@/components/layout/app-nav/app-sidebar-core'

import { usersQueryKey } from '@/features/user/hooks/use-get-user-profile'

const AppSidebar: FC = async () => {
  const sessionData = await getSessionData()
  const queryClient = createQueryClient()

  await queryClient.prefetchQuery({
    queryKey: usersQueryKey.active,
    queryFn: async () => {
      const data = await getActiveUserProfile()
      return { data } satisfies FetchResponse
    },
  })

  const queryState = dehydrate(queryClient)

  return (
    <HydrationBoundary state={queryState}>
      <AppSidebarCore sessionData={sessionData} />
    </HydrationBoundary>
  )
}

export default AppSidebar
