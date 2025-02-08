import { Organization } from '@prisma/client'
import { FC } from 'react'
import { FiUserPlus } from 'react-icons/fi'

import Banner from '@/components/general/banner'
import Link from '@/components/general/link'
import NoResults from '@/components/general/no-results'

type Props = {
  organizations?: Organization[]
}

const Dashboard: FC<Props> = ({ organizations }) => {
  return (
    <section>
      {!organizations?.length ? (
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
                  Invited to an organization by someone else? Follow the link in
                  the invitation email to get started.
                </Banner>
              </div>
            }
          />
        </div>
      ) : null}
    </section>
  )
}

export default Dashboard
