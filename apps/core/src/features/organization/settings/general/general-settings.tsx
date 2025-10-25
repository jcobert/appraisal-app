'use client'

import { FC } from 'react'
import { useIsClient } from 'usehooks-ts'

import { Organization } from '@repo/database'
import { Separator } from '@repo/ui/ui/separator'

import { useOrgPageRedirect } from '@/hooks/use-org-page-redirect'
import { usePermissions } from '@/hooks/use-permissions'
import { useProtectPage } from '@/hooks/use-protect-page'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import OrganizationForm from '@/features/organization/organization-form'
import DangerZone from '@/features/organization/settings/general/danger-zone'
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
  })

  useOrgPageRedirect(organizationId)

  const userCanEditInfo = can('edit_org_info')

  const isClient = useIsClient()

  const { response, isLoading } = useGetOrganizations({
    id: organizationId,
    options: { enabled: !isCheckingAuth && !isCheckingPermissions },
  })

  const organization = response?.data

  if (!organization) return null

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
        disabled={
          isLoading || isCheckingPermissions || !userCanEditInfo || !isClient
        }
        isUpdate
      />
      <Separator />
      <NotificationSettings />
      <Separator />
      <DangerZone organizationName={organization?.name} />
    </section>
  )
}

export default GeneralSettings
