import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { ComponentPropsWithoutRef, FC } from 'react'

import { getUserOrganizations } from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'

import AppSidebarCore from '@/components/layout/sidebar-nav/app-sidebar-core'

const AppSidebar: FC = async () => {
  const session = getKindeServerSession()

  const { getUser, isAuthenticated, getPermissions } = session

  const user = await getUser()
  const loggedIn = await isAuthenticated()
  const permissions = await getPermissions()

  const profile = await getActiveUserProfile()
  const organizations = await getUserOrganizations()

  const sessionData = {
    loggedIn,
    permissions,
    user,
    profile,
    organizations,
  } satisfies ComponentPropsWithoutRef<typeof AppSidebarCore>['sessionData']

  return <AppSidebarCore sessionData={sessionData} />
}

export default AppSidebar
