import { Appraiser } from '@prisma/client'
import { FC } from 'react'

import AppraiserCard from '@/components/features/appraiser/appraiser-card'

type Props = {
  appraisers?: Appraiser[] | null
}

const AppraiserList: FC<Props> = ({ appraisers }) => {
  if (!appraisers?.length) return null

  return (
    <div className='flex flex-col gap-4'>
      {appraisers?.map((appraiser) => (
        <AppraiserCard key={appraiser.id} appraiser={appraiser} />
      ))}
    </div>
  )
}

export default AppraiserList
