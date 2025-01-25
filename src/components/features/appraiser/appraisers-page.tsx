'use client'

import { useRouter } from 'nextjs-toploader/app'
import { FC } from 'react'
import { FiUserPlus } from 'react-icons/fi'

import AppraisersList from '@/components/features/appraiser/appraisers-list'
import { useGetAppraisers } from '@/components/features/appraiser/hooks/use-get-appraisers'
import Button from '@/components/general/button'

const AppraisersPage: FC = () => {
  const router = useRouter()
  const { response } = useGetAppraisers({ options: { enabled: true } })

  return (
    <div className='flex flex-col gap-8'>
      {/* Toolbar */}
      <div className='flex justify-end'>
        <Button
          variant='secondary'
          onClick={() => router.push('/appraisers/create')}
        >
          <FiUserPlus />
          Add appraiser
        </Button>
      </div>

      <AppraisersList appraisers={response?.data} />
    </div>
  )
}

export default AppraisersPage
