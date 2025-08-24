import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { FC } from 'react'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { getSessionData } from '@/lib/db/utils'

import coreFetch, { getAbsoluteUrl } from '@/utils/fetch'
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
      queryFn: () =>
        coreFetch.GET({
          url: getAbsoluteUrl(`${CORE_API_ENDPOINTS.user}/active`),
        }),
    }),
    queryClient.prefetchQuery({
      queryKey: organizationsQueryKey.all,
      queryFn: () =>
        coreFetch.GET({
          url: getAbsoluteUrl(`${CORE_API_ENDPOINTS.organization}`),
        }),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AppSidebarCore sessionData={sessionData} />
    </HydrationBoundary>
  )
}

export default AppSidebar
