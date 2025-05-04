'use client'

import * as Toggle from '@radix-ui/react-toggle-group'
import { useTheme } from 'next-themes'
import { FC } from 'react'
import { IconType } from 'react-icons'
import {
  MdDarkMode,
  MdLightMode,
  MdOutlineAppSettingsAlt,
} from 'react-icons/md'
import { useIsClient } from 'usehooks-ts'

import { objectKeys } from '@/utils/general'
import { cn } from '@/utils/style'

enum Theme {
  light = 'Light',
  dark = 'Dark',
  system = 'Auto',
}

type Props = {
  className?: string
}

const themeIcon = {
  dark: MdDarkMode,
  light: MdLightMode,
  system: MdOutlineAppSettingsAlt,
} satisfies { [key in keyof typeof Theme]: IconType }

const Item = ({
  theme,
  className,
}: {
  theme: keyof typeof Theme
  className?: string
}) => {
  const isDark = theme === 'dark'
  const isLight = theme === 'light'
  const isSystem = theme === 'system'

  const Icon = themeIcon?.[theme]

  if (!theme) return null

  return (
    <Toggle.Item
      // aria-label={`${Theme?.[theme]}`}
      value={theme}
      className={cn(
        'p-2 px-4 border-x border-transparent dark:bg-gray-900 hover:data-[state="off"]:dark:bg-gray-800 hover:data-[state="off"]:bg-gray-100 transition',
        isLight &&
          'rounded-l data-[state="on"]:bg-amber-500 data-[state="on"]:text-almost-white',
        isDark &&
          'data-[state="on"]:bg-indigo-900 data-[state="on"]:text-almost-white data-[state="on"]:border-gray-500',
        isSystem &&
          'rounded-r data-[state="on"]:bg-blue-500 data-[state="on"]:text-almost-white',
        className,
      )}
    >
      <div className='flex flex-col'>
        <Icon aria-hidden className='mx-auto' />
        <span className='text-xs'>{`${Theme?.[theme]}`}</span>
      </div>
    </Toggle.Item>
  )
}

const ThemeSelector: FC<Props> = ({ className }) => {
  const isClient = useIsClient()
  const { theme, setTheme } = useTheme()

  if (!isClient) return null

  return (
    <div>
      <Toggle.Root
        aria-label='theme selector'
        type='single'
        value={theme}
        onValueChange={(val) => {
          if (val) setTheme(val)
        }}
        className={cn(
          'flex w-full items-center justify-center border dark:border-gray-500 rounded-[0.3125rem]',
          className,
        )}
      >
        {objectKeys(Theme)?.map((thm) => (
          <Item key={thm} theme={thm} className='flex-auto' />
        ))}
      </Toggle.Root>
    </div>
  )
}

export default ThemeSelector
