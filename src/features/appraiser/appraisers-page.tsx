'use client'

import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { FiUserPlus } from 'react-icons/fi'

import { Button } from '@/components/ui/button'

import AppraisersList from '@/features/appraiser/appraisers-list'
import { useGetAppraisers } from '@/features/appraiser/hooks/use-get-appraisers'

const AppraisersPage: FC = () => {
  const router = useRouter()
  const { response } = useGetAppraisers({ options: { enabled: true } })

  return (
    <div className='flex flex-col gap-8 pb-8'>
      {/* Toolbar */}
      <div className='flex justify-end'>
        <Button
          variant='outline'
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
