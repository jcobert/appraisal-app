import { Metadata } from 'next'
import { FC } from 'react'

import { getOrgInvitation } from '@/lib/db/queries/organization'

import { isAllowedServer } from '@/utils/auth'
import { fullName } from '@/utils/string'

import AuthLink from '@/components/auth/auth-link'
import Button from '@/components/general/button'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'

type Props = PageParams<{ id: string }, { inv: string }>

export const metadata: Metadata = generatePageMeta({
  title: 'Organizations',
})

const heading = "You've been invited to join an organization."

const Page: FC<Props> = async ({ params, searchParams }) => {
  const organizationId = (await params)?.id
  const inviteToken = (await searchParams)?.inv

  const invitation = await getOrgInvitation(
    {
      where: { organizationId, token: inviteToken },
    },
    { publicAccess: true },
  )

  const { allowed: loggedIn } = await isAllowedServer()

  const postLoginRedirect = `/organization-invite/${organizationId}/join?inv=${inviteToken}`

  return (
    <PageLayout>
      <div className='mt-8 p-4 py-8 border rounded bg-almost-white max-w-prose mx-auto flex flex-col gap-8'>
        {!loggedIn ? (
          <div className='prose text-center'>
            <h1 className='max-sm:text-3xl font-medium text-balance'>
              Welcome to PrizmaTrack
            </h1>
            <h2 className='text-lg font-medium text-balance'>{heading}</h2>
          </div>
        ) : null}

        <div className='mx-auto flex flex-col gap-3 border rounded px-8 py-4 pb-2 text-balance'>
          <h3 className='text-2xl font-medium'>
            {invitation?.organization?.name}
          </h3>
          <div className='flex flex-col items-center gap-1'>
            <span>Invited by</span>
            <span className='font-medium'>
              {fullName(
                invitation?.invitedBy?.firstName,
                invitation?.invitedBy?.lastName,
              )}
            </span>
          </div>

          <dl>
            {/* <div className='flex items-center gap-4'>
              <dt>Organization:</dt>
              <dd>{invitation?.organization?.name}</dd>
            </div> */}
            {/* <div className='flex items-center gap-4'>
              <dt>Invited by:</dt>
              <dd>
                {fullName(
                  invitation?.invitedBy?.firstName,
                  invitation?.invitedBy?.lastName,
                )}
              </dd>
            </div> */}
          </dl>
        </div>

        {!loggedIn ? (
          <div className='flex flex-col items-center gap-6 mx-auto'>
            <p className='text-center max-w-prose text-balance'>
              Before you can join you will need an account. Click continue to
              register or sign in.
            </p>
            <AuthLink type='register' postLoginRedirectURL={postLoginRedirect}>
              Continue
            </AuthLink>

            {/* <Confirmation>
            <Button
              variant='tertiary'
              color='general'
              className='max-sm:w-full'
            >
              Decline
            </Button>
          </Confirmation> */}
          </div>
        ) : (
          <div className='flex flex-col items-center gap-6 mx-auto'>
            <Button>Join organization</Button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

export default Page
