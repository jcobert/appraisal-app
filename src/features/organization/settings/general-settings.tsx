import { FC } from 'react'

import OrganizationForm from '@/features/organization/organization-form'

type Props = {
  className?: string
}

const GeneralSettings: FC<Props> = () => {
  return <OrganizationForm />
}

export default GeneralSettings
