import { ReactNode } from 'react'

import Heading from '@/components/layout/heading'

import SettingsNavigation from '@/features/organization/settings/settings-navigation'

const Layout = async ({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) => {
  const orgId = (await params)?.id

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-col gap-6'>
        <Heading text='Settings' />
        <SettingsNavigation organizationId={orgId} />
      </div>
      <div>{children}</div>
    </div>
  )
}

export default Layout
