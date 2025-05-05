import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import React, { FC } from 'react'

import SidebarNav from '@/components/layout/nav/sidebar/sidebar-nav'

import { SessionData } from '@/types/auth'

type Props = {
  //
}

const Sidebar: FC<Props> = async () => {
  const session = getKindeServerSession()

  const { getUser, isAuthenticated, getPermissions } = session

  const user = await getUser()
  const loggedIn = await isAuthenticated()
  const permissions = await getPermissions()

  const sessionData = {
    loggedIn,
    permissions,
    user,
  } satisfies SessionData

  return (
    <div
      id='navigation-sidebar'
      className='border-r px-2 xl:px-6 max-md:hidden'
    >
      <SidebarNav sessionData={sessionData} />
    </div>
  )
}

export default Sidebar
