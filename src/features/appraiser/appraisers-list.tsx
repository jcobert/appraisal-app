import { Appraiser } from '@prisma/client'
import { FC } from 'react'

import AppraiserCard from '@/features/appraiser/appraiser-card'

type Props = {
  appraisers?: Appraiser[] | null
}

const AppraisersList: FC<Props> = ({ appraisers }) => {
  if (!appraisers?.length) return null

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      {appraisers?.map((appraiser) => (
        <AppraiserCard key={appraiser.id} appraiser={appraiser} />
      ))}
    </div>
  )
}

export default AppraisersList
