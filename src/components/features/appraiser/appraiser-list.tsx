import { Appraiser } from '@prisma/client'
import { FC } from 'react'

import AppraiserCard from '@/components/features/appraiser/appraiser-card'

type Props = {
  appraisers?: Appraiser[] | null
}

const AppraiserList: FC<Props> = ({ appraisers }) => {
  if (!appraisers?.length) return null

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
      {appraisers?.map((appraiser) => (
        <AppraiserCard key={appraiser.id} appraiser={appraiser} />
      ))}
    </div>
  )
}

export default AppraiserList
