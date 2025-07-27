'use client'

import { OrgMember, Organization } from '@prisma/client'
import { useRouter } from 'next/router'
import { FC, useEffect } from 'react'

import { homeUrl } from '@/utils/nav'

import Back from '@/components/general/back'

import { useOrgPageRedirect } from '@/hooks/use-org-page-redirect'
import { usePermissions } from '@/hooks/use-permissions'
import { useProtectPage } from '@/hooks/use-protect-page'

import { useGetOrgMember } from '@/features/organization/hooks/use-get-org-member'

type Props = {
  organizationId?: Organization['id']
  memberId?: OrgMember['id']
}

const OrgMemberPage: FC<Props> = ({ organizationId, memberId }) => {
  const router = useRouter()
  useProtectPage()

  const { can } = usePermissions({
    area: 'organization',
    organizationId: organizationId || '',
  })

  useOrgPageRedirect(organizationId || '', { enabled: !!organizationId })

  /**
   * @todo
   * Unsure how this page will be used yet, but will probably
   * want to add exception for if this is user's own member page.
   */
  const userCanViewMember = can('view_org_member_details')

  // As extra security, redirect if user doesn't have permissions.
  // Could happen if user's rights were changed by admin while user is here.
  useEffect(() => {
    if (!userCanViewMember) {
      router.push(homeUrl(true))
    }
  }, [userCanViewMember, router])

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
