'use client'

import { OrgInvitation } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC } from 'react'

import { successful } from '@/utils/fetch'

import FullScreenLoader from '@/components/layout/full-screen-loader'
import { Button } from '@/components/ui/button'

import { useDisableInteraction } from '@/hooks/use-disable-interaction'

import {
  UseOrganizationJoinProps,
  useOrganizationJoin,
} from '@/features/organization/hooks/use-organization-join'

type Props = Pick<UseOrganizationJoinProps, 'organizationId'> & {
  invitation: Pick<OrgInvitation, 'token' | 'status'> | null
}

const OrgJoinForm: FC<Props> = ({ organizationId, invitation }) => {
  const router = useRouter()

  const { mutateAsync, isPending } = useOrganizationJoin({ organizationId })

  const { token, status } = invitation || {}

  useDisableInteraction({ disable: isPending })

  const joinOrg = async () => {
    if (!token || !status) return

    const res = await mutateAsync({ token, status })

    // 409 means user is already member of org.
    if (successful(res?.status) || res?.status === 409) {
      router.push(`/organizations/${organizationId}`)
    }
  }

  return (
    <>
      {isPending ? <FullScreenLoader /> : null}
      <div className='flex flex-col items-center gap-6 mx-auto'>
        <Button onClick={joinOrg}>Join organization</Button>
      </div>
    </>
  )
}

export default OrgJoinForm
