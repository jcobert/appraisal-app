'use client'

import { sortBy } from 'lodash'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { FC, ReactNode, useCallback, useMemo } from 'react'
import { FaBuilding } from 'react-icons/fa6'

import { Organization } from '@repo/database'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui'
import { SidebarMenuButton, useSidebar } from '@repo/ui'

import { cn } from '@/lib/utils'

import { useOrganizationContext } from '@/providers/organization-provider'

import Avatar from '@/components/general/avatar'

type Props = {
  organizations?: Organization[] | null
  children?: ReactNode
}

const SidebarOrgSelector: FC<Props> = ({ organizations }) => {
  const { isMobile, setOpenMobile } = useSidebar()

  const {
    activeOrgId,
    selectedOrganization,
    switchOrganization,
    organizations: contextOrganizations,
  } = useOrganizationContext()

  // Use organizations from context if available, otherwise fall back to props/query
  const organizationOptions = useMemo(() => {
    const orgList = contextOrganizations?.length
      ? contextOrganizations
      : organizations
    if (!orgList?.length) return []
    return sortBy(orgList, (org) => org?.name?.toLowerCase())
  }, [contextOrganizations, organizations])

  const selectOrg = useCallback(
    async (org?: typeof selectedOrganization) => {
      const newOrg = org || organizationOptions?.[0]
      if (newOrg && newOrg.id !== activeOrgId) {
        await switchOrganization(newOrg.id)
      }
    },
    [organizationOptions, activeOrgId, switchOrganization],
  )

  // if (!isClient)
  //   return (
  //     <div
  //       aria-hidden
  //       className={cn('rounded flex items-center gap-2', open && 'p-2')}
  //     >
  //       <Skeleton className='size-8 rounded-full flex-none' />
  //       {open ? <Skeleton className='w-full h-6' /> : null}
  //     </div>
  //   )

  return (
    <DropdownMenu
    // modal={isMobile ? false : true}
    >
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size='lg'
          className={cn(
            'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
            'group/org-selector',
          )}
        >
          <div
            className={cn(
              'size-8 flex items-center justify-center rounded-lg shrink-0',
              // 'bg-sidebar-primary',
            )}
          >
            <FaBuilding
              className={cn(
                'text-xl',
                // 'text-sidebar-primary-foreground',
              )}
            />
          </div>

          <div className='grid flex-1 text-left text-sm leading-tight'>
            {selectedOrganization ? (
              <span className='truncate font-medium'>
                {selectedOrganization?.name}
              </span>
            ) : (
              <span className='text-xs text-muted-foreground whitespace-nowrap'>
                Select an organization...
              </span>
            )}
          </div>
          <ChevronsUpDown className='ml-auto' />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg max-w-prose'
        align='start'
        side={isMobile ? 'bottom' : 'right'}
        sideOffset={4}
      >
        <DropdownMenuLabel className='text-muted-foreground text-xs'>
          Organizations
        </DropdownMenuLabel>
        {organizationOptions?.map((org) => {
          const isActive = org?.id === activeOrgId
          return (
            <DropdownMenuItem
              key={org?.id}
              className={cn('gap-2 p-2', isActive && 'bg-sidebar-accent/50')}
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
              <span
                className={cn(
                  'flex-1',
                  isActive && 'text-primary__ font-medium',
                )}
              >
                {org?.name}
              </span>
              {isActive ? <Check className='text-primary' /> : null}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          asChild
          className='gap-2 p-2'
          onSelect={() => {
            setOpenMobile(false)
          }}
        >
          <Link href='/organizations/create'>
            <div className='flex size-6 items-center justify-center bg-transparent'>
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

export default SidebarOrgSelector
