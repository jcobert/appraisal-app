'use client'

import { Organization, User } from '@prisma/client'
import { sortBy } from 'lodash'
import { FC, useEffect, useMemo } from 'react'
import { FiUserPlus } from 'react-icons/fi'

import { greeting } from '@/utils/string'

import Banner from '@/components/general/banner'
import Link from '@/components/general/link'
import NoResults from '@/components/general/no-results'
import SelectInput, { SelectOption } from '@/components/inputs/select-input'
import Heading from '@/components/layout/heading'

import { useStoredSettings } from '@/hooks/use-stored-settings'

type Props = {
  user: User | null
  organizations: Organization[] | null
}

const Dashboard: FC<Props> = ({ user, organizations }) => {
  const hasOrgs = !!organizations?.length

  const { settings, updateSettings } = useStoredSettings()

  const organizationOptions = useMemo(() => {
    if (!hasOrgs) return []
    return sortBy(
      organizations?.map(
        (org) => ({ label: org?.name, value: org?.id }) satisfies SelectOption,
      ),
      (opt) => opt?.label,
    )
  }, [organizations])

  const selectedOrganization = useMemo(() => {
    if (!organizationOptions?.length) return undefined
    return organizationOptions?.find(
      (opt) => opt?.value === settings?.activeOrg,
    )
  }, [settings?.activeOrg, organizationOptions])

  // Update local storage with first org on load, if none exists.
  useEffect(() => {
    if (!settings?.activeOrg || !selectedOrganization) {
      updateSettings({ activeOrg: organizationOptions?.[0]?.value })
    }
  }, [selectedOrganization])

  return (
    <div>
      <div className='flex md:items-start md:justify-between max-md:flex-col gap-6 flex-wrap'>
        <Heading
          className='max-md:mx-auto flex-none'
          text={greeting(user?.firstName)}
        />
        {hasOrgs ? (
          <SelectInput
            id='organization'
            // label='Organization'
            ariaLabel='Organization'
            placeholder='Select organization...'
            className='md:w-fit md:min-w-64'
            options={organizationOptions}
            value={selectedOrganization ?? null}
            onChange={(opt) => updateSettings({ activeOrg: opt?.value })}
          />
        ) : null}
      </div>

      <section>
        {!hasOrgs ? (
          <div className='flex flex-col gap-6'>
            <NoResults
              title="You don't belong to any organizations"
              subtitle='Get started by adding one now.'
              actions={
                <div className='flex flex-col items-center gap-8'>
                  <Link
                    href='/organizations/create'
                    variant='primary'
                    className='not-prose'
                  >
                    <FiUserPlus />
                    Add organization
                  </Link>
                  <Banner className='max-w-md'>
                    Invited to an organization by someone else? Follow the link
                    in the invitation email to get started.
                  </Banner>
                </div>
              }
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default Dashboard
