'use client'

import { Appraiser } from '@prisma/client'
import { useRouter } from 'next-nprogress-bar'
import { usePathname } from 'next/navigation'
import { FC } from 'react'
import { FaGear } from 'react-icons/fa6'

import { fullName } from '@/utils/string'

import { useGetAppraisers } from '@/features/appraiser/hooks/use-get-appraisers'
import Back from '@/components/general/back'
import Button from '@/components/general/button'
import DropdownMenu, {
  DropdownMenuItem,
} from '@/components/layout/dropdown-menu'
import Heading from '@/components/layout/heading'

import { useProtectPage } from '@/hooks/use-protect-page'

type Props = {
  appraiserId?: Appraiser['id']
}

const AppraiserPage: FC<Props> = ({ appraiserId }) => {
  useProtectPage()

  const router = useRouter()
  const pathname = usePathname()

  const { response } = useGetAppraisers({
    id: appraiserId,
    options: { enabled: true },
  })

  const { firstName, lastName } = response?.data || {}
  const name = fullName(firstName, lastName)

  return (
    <div className='flex flex-col gap-4 max-sm:gap-2'>
      <div>
        <Back href='/appraisers' text='Appraisers' />
      </div>
      <div className='md:flex justify-between'>
        <div className='flex flex-col gap-2 w-full'>
          <Heading text={name} className='font-normal' />

          <span
            aria-hidden
            className='h-px w-1/2 border-b-2 border-brand-extra-light max-md:hidden'
          />
        </div>
        <DropdownMenu
          trigger={
            <Button
              variant='secondary'
              className='p-2 min-w-0 size-fit max-md:ml-auto'
            >
              <FaGear className='text-lg' />
            </Button>
          }
        >
          <DropdownMenuItem
            onSelect={() => {
              router.push(`${pathname}/edit`)
            }}
          >
            Edit Appraiser
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default AppraiserPage
