'use client'

import { FC } from 'react'

import AppraiserList from '@/components/features/appraiser/appraiser-list'
import { useGetAppraisers } from '@/components/features/appraiser/hooks/use-get-appraisers'

const AppraisersPage: FC = () => {
  const { response } = useGetAppraisers({ options: { enabled: true } })

  return (
    <div>
      <AppraiserList appraisers={response?.data} />
    </div>
  )
}

export default AppraisersPage
