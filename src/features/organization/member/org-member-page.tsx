'use client'

import { OrgMember, Organization } from '@prisma/client'
import { FC } from 'react'

import Back from '@/components/general/back'

import { useProtectPage } from '@/hooks/use-protect-page'

import { useGetOrgMember } from '@/features/organization/hooks/use-get-org-member'

type Props = {
  organizationId?: Organization['id']
  memberId?: OrgMember['id']
}

const OrgMemberPage: FC<Props> = ({ organizationId, memberId }) => {
  useProtectPage()

  const { response } = useGetOrgMember({
    organizationId,
    memberId,
    options: { enabled: true },
  })

  const { user, roles } = response?.data || {}

  return (
    <div className='flex flex-col gap-8 max-sm:gap-4'>
      <div>
        <Back href={`/organizations/${organizationId}`} />
      </div>
    </div>
  )
}

export default OrgMemberPage
