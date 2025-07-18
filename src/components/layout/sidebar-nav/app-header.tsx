import { FC } from 'react'

import { cn } from '@/lib/utils'

import LogoLink from '@/components/layout/nav/logo-link'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

const AppHeader: FC = () => {
  return (
    <header className='bg-background sticky top-0 z-50 flex w-full items-center border-b'>
      <div className='flex h-[var(--header-height)] w-full items-center pr-4'>
        <div className='p-2 w-[--sidebar-width-icon] -mr-px'>
          <SidebarTrigger className='md:size-8' />
        </div>
        <Separator orientation='vertical' className='h-1/3 mr-4' />

        <div className='w-full flex items-center gap-4'>
          <LogoLink
            loggedIn
            className={cn(
              'max-md:relative max-md:left-[calc(50%-var(--sidebar-width-icon))]',
            )}
          />
        </div>
      </div>
    </header>
  )
}

export default AppHeader
