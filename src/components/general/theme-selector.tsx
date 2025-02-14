'use client'

import { useTheme } from 'next-themes'
import { FC } from 'react'
import { MdDarkMode, MdLightMode } from 'react-icons/md'
import { useIsClient } from 'usehooks-ts'

import { cn } from '@/utils/style'

import Button from '@/components/general/button'

type Props = {
  //
}

const ThemeSelector: FC<Props> = () => {
  const isClient = useIsClient()
  const { resolvedTheme, setTheme } = useTheme()

  const isDark = resolvedTheme === 'dark'
  const isLight = resolvedTheme === 'light'

  const ActiveIcon = isDark ? MdDarkMode : MdLightMode

  if (!isClient) return null

  return (
    <Button
      className={cn(
        'p-2 rounded-full min-w-0',
        isLight &&
          'text-neutral-600 border-neutral-400 hover:text-neutral-700 hover:border-neutral-500',
        isDark &&
          'bg-indigo-900 text-almost-white hover:text-neutral-100 border-almost-white hover:bg-indigo-950 hover:border-neutral-50',
      )}
      variant='secondary'
      onClick={() => {
        if (isLight) {
          setTheme('dark')
        } else setTheme('light')
      }}
    >
      <ActiveIcon
      // className={cn('', isLight && 'text-amber-500', isDark && '')}
      />
    </Button>
  )
}

export default ThemeSelector
