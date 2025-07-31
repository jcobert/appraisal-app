'use client'

import { Organization } from '@prisma/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FC, useMemo } from 'react'

import { NavItem } from '@/utils/nav'

import Crumbs from '@/components/layout/app-nav/crumbs'
import { TabNav, TabNavLink, TabNavList } from '@/components/ui/tab-navigation'

type Props = {
  organizationId: Organization['id']
  // children: ReactNode
  // className?: string
}

const SettingsNavigation: FC<Props> = ({ organizationId }) => {
  const pathname = usePathname()
  const tabs: NavItem[] = useMemo(
    () => [
      {
        id: 'general',
        name: 'General',
        url: `/organizations/${organizationId}/settings`,
      },
      {
        id: 'users',
        name: 'Users',
        url: `/organizations/${organizationId}/settings/users`,
      },
    ],
    [organizationId],
  )

  return (
    <>
      <Crumbs hidden />
      <TabNav className='border-b pb-2'>
        <TabNavList>
          {tabs?.map((item) => (
            <TabNavLink key={item?.id} active={pathname === item?.url} asChild>
              <Link href={item?.url}>{item?.name}</Link>
            </TabNavLink>
          ))}
        </TabNavList>
      </TabNav>
    </>
  )
}

export default SettingsNavigation
