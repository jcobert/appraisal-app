import { FC, ReactNode } from 'react'

import { cn } from '@/lib/utils'

import LogoLink from '@/components/general/logo-link'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type Props = { children: ReactNode }

const AppHeader: FC<Props> = ({ children }) => {
  return (
    <header className='bg-background sticky top-0 z-50 flex w-full items-center border-b'>
      <div className='flex h-[var(--header-height)] w-full items-center pr-4'>
        <div
          className={cn(
            'p-2 w-[--sidebar-width-icon] -mr-px',
            'sticky left-0 top-0',
          )}
        >
          <SidebarTrigger className='md:size-8' />
        </div>
        <Separator orientation='vertical' className='h-1/2 md:h-full mr-4' />

        <div className='w-full flex items-center gap-4'>
          <LogoLink
            loggedIn
            className={cn(
              'max-md:relative max-md:left-[calc(50%-var(--sidebar-width-icon))]',
            )}
          />
          {/* Breadcrumbs */}
          <div>{children}</div>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
