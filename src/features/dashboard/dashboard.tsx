'use client'

import { Organization, User } from '@prisma/client'
import Link from 'next/link'
import { FC } from 'react'
import { IoAdd } from 'react-icons/io5'

import { greeting } from '@/utils/string'

import Banner from '@/components/general/banner'
import NoResults from '@/components/general/no-results'
import Heading from '@/components/layout/heading'
import { Button } from '@/components/ui/button'

type Props = {
  user: User | null
  organizations: Organization[] | null
}

const Dashboard: FC<Props> = ({ user, organizations }) => {
  const hasOrgs = !!organizations?.length

  return (
    <div>
      <div className='flex md:items-start md:justify-between max-md:flex-col gap-6 flex-wrap'>
        <Heading
          className='max-md:mx-auto flex-none'
          text={greeting(user?.firstName)}
        />
      </div>

      <section>
        {!hasOrgs ? (
          <div className='flex flex-col gap-6 mt-8'>
            <NoResults
              title="You don't belong to any organizations"
              subtitle='Get started by creating one now.'
              actions={
                <div className='flex flex-col items-center gap-8'>
                  <Button asChild className='not-prose'>
                    <Link href='/organizations/create'>
                      <IoAdd />
                      Create organization
                    </Link>
                  </Button>
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
