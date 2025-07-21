import { KindePermissions } from '@kinde-oss/kinde-auth-nextjs/types'
import { FC } from 'react'
import { FaCircleCheck, FaRegCircleXmark } from 'react-icons/fa6'

import { getUserPermissions } from '@/utils/auth'

type Props = {
  permissions: KindePermissions | null
  full?: boolean
}

const Permissions: FC<Props> = ({ permissions, full = true }) => {
  const userPermissions = getUserPermissions(permissions, { all: full })

  return (
    <div className='border__ rounded px-2__ w-full'>
      <table className='w-full'>
        <tbody>
          {userPermissions?.map((perm) => (
            <tr key={perm?.key} className='border-b__ last:border-none'>
              <td className='px-2 py-1 min-w-fit text-sm text-nowrap font-medium__ border-r__'>
                {perm?.name}
              </td>
              <td className='text-lg__ w-1/2 px-3 py-1'>
                {perm?.allowed ? (
                  <FaCircleCheck className='mx-auto text-emerald-500' />
                ) : (
                  <FaRegCircleXmark className='mx-auto text-rose-500' />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Permissions
