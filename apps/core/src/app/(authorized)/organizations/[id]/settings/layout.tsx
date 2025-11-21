import { ReactNode } from 'react'

import { protectPage } from '@/lib/db/utils'

import Heading from '@/components/layout/heading'

import SettingsNavigation from '@/features/organization/settings/settings-navigation'

const Layout = async ({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) => {
  const organizationId = (await params)?.id

  await protectPage({
    permission: {
      action: 'organization:edit',
      organizationId,
    },
  })

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-col gap-6'>
        <Heading text='Settings' />
        <SettingsNavigation organizationId={organizationId} />
      </div>
      <div className='w-full max-w-4xl mx-auto'>{children}</div>
    </div>
  )
}

export default Layout
