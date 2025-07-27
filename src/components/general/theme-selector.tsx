'use client'

import { Check, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { FC } from 'react'
import { useIsClient } from 'usehooks-ts'

import { cn } from '@/lib/utils'

import { objectKeys } from '@/utils/general'

import { Theme } from '@/providers/theme-provider'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

const ThemeSelector: FC = () => {
  const isClient = useIsClient()
  const { setTheme, theme } = useTheme()
  const { isMobile, open, openMobile } = useSidebar()

  if (!isClient)
    return (
      <Skeleton
        className={cn(
          'size-8 rounded-md',
          !open && 'mx-auto',
          open && 'ml-2 mb-2',
        )}
      />
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          className={cn(
            'size-fit',
            (open || openMobile) && 'ml-2 transition-all',
            (open || isMobile) && 'mb-2',
          )}
          variant='outline'
        >
          <Sun className='h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
          <Moon className='absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
          <span className='sr-only'>Toggle theme</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className='text-muted-foreground text-xs'>
          Theme
        </DropdownMenuLabel>
        {objectKeys(Theme)?.map((t) => {
          const isActive = t === theme
          return (
            <DropdownMenuItem
              key={t}
              onClick={() => setTheme(t)}
              className='flex items-center'
            >
              <span className='flex-1 capitalize'>{t}</span>
              {isActive ? <Check className='text-primary' /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ThemeSelector
