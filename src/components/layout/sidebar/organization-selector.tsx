'use client'

import { Organization } from '@prisma/client'
import { sortBy } from 'lodash'
import { ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { FC, ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useIsClient } from 'usehooks-ts'

import { cn } from '@/lib/utils'

import Avatar from '@/components/general/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

import { useStoredSettings } from '@/hooks/use-stored-settings'

type Props = {
  organizations?: Organization[] | null
  children?: ReactNode
}

const OrganizationSelector: FC<Props> = ({ organizations }) => {
  const { settings, updateSettings } = useStoredSettings()
  const isClient = useIsClient()
  const { isMobile, open, openMobile } = useSidebar()

  const organizationOptions = useMemo(() => {
    if (!organizations?.length) return []
    return sortBy(organizations, (org) => org?.name)
  }, [organizations])

  const selectedOrganization = useMemo(() => {
    if (!organizationOptions?.length) return undefined
    return organizationOptions?.find((org) => org?.id === settings?.activeOrg)
  }, [settings?.activeOrg, organizationOptions])

  const selectOrg = useCallback(
    (org?: typeof selectedOrganization) => {
      const newOrg = org || organizationOptions?.[0]
      updateSettings({ ...settings, activeOrg: newOrg?.id })
    },
    [updateSettings, settings, organizationOptions],
  )

  // Update local storage with first org on load, if none exists.
  useEffect(() => {
    if (!settings?.activeOrg || !selectedOrganization) {
      selectOrg()
    }
  }, [selectedOrganization])

  if (!isClient)
    return (
      <div
        aria-hidden
        className={cn('rounded flex items-center gap-2', open && 'p-2')}
      >
        <Skeleton className='size-8 rounded-full flex-none' />
        {open ? <Skeleton className='w-full h-6' /> : null}
      </div>
    )

  return (
    <DropdownMenu modal={isMobile ? false : true}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size='lg'
          className={cn(
            'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
            'group/org-selector',
            !open && !openMobile && 'rounded-full',
          )}
        >
          <div className='flex aspect-square object-contain items-center justify-center rounded-full'>
            <Avatar
              image={selectedOrganization?.avatar}
              name={selectedOrganization?.name}
              size='sm'
              className='border'
              fallbackClassName={cn(
                !open &&
                  !openMobile &&
                  'group-hover/org-selector:bg-background/50 transition',
              )}
            />
          </div>
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-medium'>
              {selectedOrganization?.name}
            </span>
          </div>
          <ChevronsUpDown className='ml-auto' />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
        align='start'
        side={isMobile ? 'bottom' : 'right'}
        sideOffset={4}
      >
        <DropdownMenuLabel className='text-muted-foreground text-xs'>
          Organizations
        </DropdownMenuLabel>
        {organizationOptions?.map((org) => (
          <DropdownMenuItem
            key={org?.id}
            className='gap-2 p-2'
            onSelect={() => {
              selectOrg(org)
            }}
          >
            <Avatar
              image={org?.avatar}
              name={org?.name}
              size='xs'
              className='border'
              // fallbackClassName='bg-transparent'
            />
            <span>{org?.name}</span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem className='gap-2 p-2' asChild>
          <Link href='/organizations/create'>
            <div className='flex size-6 items-center justify-center rounded-full border bg-transparent'>
              <Plus className='size-4' />
            </div>
            <div className='text-muted-foreground font-medium'>
              Add organization
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default OrganizationSelector
