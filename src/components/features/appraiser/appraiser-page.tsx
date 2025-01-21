'use client'

import { Appraiser } from '@prisma/client'
import { FC } from 'react'

import { fullName } from '@/utils/string'

import Back from '@/components/general/back'
import Heading from '@/components/layout/heading'

type Props = {
  appraiser?: Appraiser | null
}

const AppraiserPage: FC<Props> = ({ appraiser }) => {
  const { firstName, lastName } = appraiser || {}
  const name = fullName(firstName, lastName)

  return (
    <div className='flex flex-col gap-4 max-sm:gap-2'>
      <div className='max-sm:px-4'>
        <Back href='/appraisers' text='Appraisers' />
      </div>
      <Heading text={name} className='font-normal' />
      <section></section>
    </div>
  )
}

export default AppraiserPage
