import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FC } from 'react'

import { PageParams } from '@repo/types'
import { Button } from '@repo/ui'
import { fullName } from '@repo/utils'

import {
  GetOrgInviteResult,
  handleGetPublicOrgInvite,
} from '@/lib/db/handlers/organization-invite-handlers'
import {
  addLogoutRedirectUrls,
  deleteLogoutRedirectUrl,
} from '@/lib/kinde-management/queries'

import { authUrl, isAuthenticated } from '@/utils/auth'

import AuthLink from '@/components/auth/auth-link'
import Banner from '@/components/general/banner'
import PageLayout from '@/components/layout/page-layout'

import { generatePageMeta } from '@/configuration/seo'
import OrgJoinForm from '@/features/organization/invitation/org-join-form'
import { getOrgInviteUrl } from '@/features/organization/utils'

type Props = PageParams<
  { id: string },
  { inv: string; redirect?: string; registered?: string }
>

export const metadata: Metadata = generatePageMeta({
  title: 'Join Organization',
})

const heading = "You've been invited to join an organization."

const errorMessage =
  "We're sorry. This link is not valid.\nIf you were invited to join an organization, the link may have expired. Please contact the owner of the organization."

const Page: FC<Props> = async ({ params, searchParams }) => {
  const [routeParams, query, { allowed: loggedIn }] = await Promise.all([
    params,
    searchParams,
    isAuthenticated(),
  ])

  const organizationId = decodeURIComponent(routeParams?.id)
  const inviteToken = decodeURIComponent(query?.inv || '')
  const isRedirect = !!query?.redirect
  const isJustRegistered = !!query?.registered

  let invitation: GetOrgInviteResult['data'] = null

  if (inviteToken) {
    invitation = (
      await handleGetPublicOrgInvite({
        organizationId,
        token: inviteToken,
        status: 'pending',
      })
    )?.data
  }

  const postLoginRedirect = getOrgInviteUrl({
    organizationId,
    inviteToken,
  })

  // Log out user before invite can be accepted.
  // Want to make sure not joining with an unintended user account that's already logged in.
  if (invitation) {
    const redirectUrl = `${postLoginRedirect?.absolute}&redirect=true`
    if (loggedIn && !isJustRegistered) {
      // Add this url to Kinde whitelist.
      const res = await addLogoutRedirectUrls([redirectUrl])
      // Logout and redirect back to this page.
      if (res) {
        redirect(
          authUrl({
            type: 'logout',
            redirectTo: redirectUrl,
          }),
        )
      }
    } else if (isRedirect) {
      // After redirect, clean up by deleting url from Kinde.
      await deleteLogoutRedirectUrl(redirectUrl)
    }
  }

  if (!invitation) {
    return (
      <PageLayout>
        <Banner variant='warning' className='w-fit mx-auto max-w-prose'>
          {errorMessage}
        </Banner>
      </PageLayout>
    )
  }

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
        </div>

        {!loggedIn ? (
          <div className='flex flex-col items-center gap-6 mx-auto'>
            <p className='text-center max-w-prose text-balance'>
              Before you can join you will need an account. Click continue to
              register or sign in.
            </p>
            <Button asChild>
              <AuthLink
                type='register'
                postLoginRedirectURL={`${postLoginRedirect?.local}&registered=true`}
              >
                Continue
              </AuthLink>
            </Button>

            {/* <Confirmation>
            <Button
              variant='ghost'
              className='max-sm:w-full'
            >
              Decline
            </Button>
          </Confirmation> */}
          </div>
        ) : (
          <OrgJoinForm
            organizationId={organizationId}
            invitation={{ token: inviteToken, status: 'accepted' }}
          />
        )}
      </div>
    </PageLayout>
  )
}

export default Page
