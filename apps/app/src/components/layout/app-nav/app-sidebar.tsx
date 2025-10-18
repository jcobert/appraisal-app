import { FC } from 'react'

import { getSessionData } from '@/lib/db/utils'

import AppSidebarCore from '@/components/layout/app-nav/app-sidebar-core'

const AppSidebar: FC = async () => {
  const sessionData = await getSessionData()

  return <AppSidebarCore sessionData={sessionData} />
}

export default AppSidebar
