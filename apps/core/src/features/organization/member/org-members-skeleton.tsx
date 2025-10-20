import { FC } from 'react'

import { Skeleton } from '@repo/ui/ui/skeleton'

import { cn } from '@/utils/style'

import Avatar from '@/components/general/avatar'

type Props = {
  count?: number
}

const Card: FC = () => {
  return (
    <div
      className={cn(
        'rounded-xl p-4 group transition flex items-center justify-between gap-4',
        'border',
        'sm:w-64 max-w-full',
      )}
    >
      <div className='flex gap-4 items-center w-full'>
        <div className='flex gap-2 items-center w-full'>
          <Skeleton className='rounded-full'>
            <Avatar />
          </Skeleton>
          <div className='flex flex-col gap-1 w-full'>
            <Skeleton className='w-1/2 sm:w-[12ch] max-w-full h-4'>
              <div className='leading-none transition' />
            </Skeleton>
            <Skeleton className='w-1/3 sm:w-[8ch] max-w-full h-3'>
              <div className='text-sm text-gray-700 leading-none capitalize' />
            </Skeleton>
          </div>
        </div>
      </div>
    </div>
  )
}

const OrgMembersSkeleton: FC<Props> = ({ count = 3 }) => {
  const len = typeof count !== 'number' || count <= 0 ? 3 : count
  return (
    <div className='flex flex-col gap-4 sm:w-fit'>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-col gap-2'>
          {Array(len)
            ?.fill(0)
            ?.map((_, i) => <Card key={i} />)}
        </div>
      </div>
    </div>
  )
}

export default OrgMembersSkeleton
