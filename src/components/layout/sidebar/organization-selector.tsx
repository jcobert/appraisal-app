'use client'

import { Organization } from '@prisma/client'
import { sortBy } from 'lodash'
import { ChevronsUpDown } from 'lucide-react'
import { FC, ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useIsClient } from 'usehooks-ts'

import Avatar from '@/components/general/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

import { useStoredSettings } from '@/hooks/use-stored-settings'

type Props = {
  organizations?: Organization[] | null
  className?: string
  children?: ReactNode
  compact?: boolean
}

const OrganizationSelector: FC<Props> = ({
  organizations,
  compact = false,
}) => {
  const { settings, updateSettings } = useStoredSettings()
  const isClient = useIsClient()

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
      <div className='rounded flex items-center gap-2'>
        <Skeleton className='size-8 rounded-full flex-none' />
        {!compact ? <Skeleton className='w-full h-6' /> : null}
        {!compact ? (
          <ChevronsUpDown className='ml-auto size-4 flex-none' />
        ) : null}
      </div>
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className='flex items-center gap-2 truncate'>
          <Avatar
            image={selectedOrganization?.avatar}
            name={selectedOrganization?.name}
            size='sm'
          />
          {!compact ? <span>{selectedOrganization?.name}</span> : null}
          {!compact ? <ChevronsUpDown className='ml-auto size-4' /> : null}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-[--radix-popper-anchor-width]'>
        {organizationOptions?.map((org) => (
          <DropdownMenuItem
            key={org?.id}
            onSelect={() => {
              selectOrg(org)
            }}
          >
            <Avatar image={org?.avatar} name={org?.name} size='xs' />
            <span>{org?.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default OrganizationSelector
