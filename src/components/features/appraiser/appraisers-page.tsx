'use client'

import { FC } from 'react'

import AppraiserList from '@/components/features/appraiser/appraiser-list'
import { useGetAppraisers } from '@/components/features/appraiser/hooks/use-get-appraisers'

type Props = {
  //
}

const AppraisersPage: FC<Props> = () => {
  const { response } = useGetAppraisers({ enabled: true })

  return (
    <div>
      <AppraiserList appraisers={response?.data} />
    </div>
  )
}

export default AppraisersPage
