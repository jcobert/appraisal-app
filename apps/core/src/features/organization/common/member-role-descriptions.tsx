import { upperFirst } from 'lodash'
import { FC } from 'react'

import { ORG_MEMBER_ROLES } from '@/features/organization/utils'

type Props = {
  className?: string
}

const descriptions = {
  appraiser: {
    overview: 'Has limited access. Can be assigned jobs.',
    bullets: ['View and update own jobs'],
  },
  manager: {
    overview: 'Manages jobs and oversees operations.',
    bullets: ['Add and assign jobs', 'View organization finances'],
  },
  owner: {
    overview: 'Has full admin access to the organization.',
    bullets: ['Add/remove members', 'Change organization settings'],
  },
} as {
  [x in (typeof ORG_MEMBER_ROLES)[number]]: {
    overview?: string
    bullets?: string[]
  }
}

const MemberRoleDescriptions: FC<Props> = () => {
  return (
    <div>
      <span className='text-balance font-medium'>Roles and Permissions</span>
      {/* <p className='text-xs text-pretty'>
        A user can be assigned multiple roles. A user will only be available to
        assign jobs, if marked as an appraiser.
      </p> */}
      <dl className='flex flex-col gap-4 mt-2'>
        {ORG_MEMBER_ROLES?.map((role) => {
          const { overview, bullets } = descriptions?.[role] || {}
          return (
            <div
              key={role}
              className='text-xs flex flex-col gap-1 border p-2 rounded bg-muted/25'
            >
              <dt className='text-sm font-medium leading-none'>
                {upperFirst(role)}
              </dt>
              <dd className='flex flex-col gap-1'>
                {overview ? <p className='text-pretty'>{overview}</p> : null}
                {bullets?.length ? (
                  <ul className='list-disc pl-2'>
                    {bullets?.map((b) =>
                      b ? (
                        <li key={b} className='list-inside'>
                          {b}
                        </li>
                      ) : null,
                    )}
                  </ul>
                ) : null}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

export default MemberRoleDescriptions
