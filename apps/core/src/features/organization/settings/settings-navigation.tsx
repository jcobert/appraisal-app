'use client'

import { usePathname } from 'next/navigation'
import { FC, useMemo } from 'react'

import { Organization } from '@repo/database'
import { TabNav, TabNavLink, TabNavList } from '@repo/ui/ui/tab-navigation'

import { NavItem } from '@/utils/nav'

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
        id: 'members',
        name: 'Members',
        url: `/organizations/${organizationId}/settings/members`,
      },
    ],
    [organizationId],
  )

  return (
    <>
      {/* <Crumbs hidden /> */}
      <TabNav className='border-b'>
        <TabNavList>
          {tabs?.map((item) => {
            const active = pathname === item?.url
            return (
              <TabNavLink key={item?.id} href={item?.url} active={active}>
                {item?.name}
              </TabNavLink>
            )
          })}
        </TabNavList>
      </TabNav>
    </>
  )
}

export default SettingsNavigation
