'use client'

import { FC } from 'react'

import { SidebarTrigger, useSidebar } from '@repo/ui/ui/sidebar'

import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

const SidebarInsetHeader: FC<Props> = () => {
  const { open } = useSidebar()

  return (
    <header className='flex sticky top-0 z-10 h-fit shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div
        className={cn(
          'flex items-center gap-2 py-[0.625rem] px-4 w-full bg-background',
          'transition-[padding] ease-linear',
          open && 'py-[1.125rem]',
        )}
      >
        <SidebarTrigger className='-ml-1' />
        {/* <Separator
          orientation='vertical'
          className='mr-2 data-[orientation=vertical]:h-4'
        /> */}
      </div>
    </header>
  )
}

export default SidebarInsetHeader
