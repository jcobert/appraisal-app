'use client'

import { Organization } from '@prisma/client'
import { FC } from 'react'
import { useIsClient } from 'usehooks-ts'

import { Separator } from '@/components/ui/separator'

import { useOrgPageRedirect } from '@/hooks/use-org-page-redirect'
import { usePermissions } from '@/hooks/use-permissions'
import { useProtectPage } from '@/hooks/use-protect-page'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import OrganizationForm from '@/features/organization/organization-form'
import NotificationSettings from '@/features/organization/settings/general/notification-settings'

type Props = {
  organizationId: Organization['id']
}

const GeneralSettings: FC<Props> = ({ organizationId }) => {
  const {
    session: { isLoading: isCheckingAuth },
  } = useProtectPage()

  const { can, isLoading: isCheckingPermissions } = usePermissions({
    area: 'organization',
    organizationId,
    // options: { enabled: false },
  })

  useOrgPageRedirect(organizationId)

  const userCanEditInfo = can('edit_org_info')

  const isClient = useIsClient()

  const { response } = useGetOrganizations({
    id: organizationId,
    options: { enabled: !isCheckingAuth && !isCheckingPermissions },
  })

  const organization = response?.data

  // // As extra security, redirect if user doesn't have permissions.
  // // Could happen if user's rights were changed by admin while user is here.
  // useEffect(() => {
  //   if (!userCanEditInfo && !isCheckingPermissions) {
  //     router.push(homeUrl(true))
  //   }
  // }, [userCanEditInfo, isCheckingPermissions, router])

  return (
    <section className='flex flex-col gap-4 px-2'>
      <OrganizationForm
        organization={organization}
        disabled={!isClient || !userCanEditInfo}
        // disabled={isCheckingPermissions || !userCanEditInfo}
        isUpdate
      />

      <Separator />

      <NotificationSettings />
    </section>
  )
}

export default GeneralSettings
