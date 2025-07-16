'use client'

import { FC } from 'react'
import { useIsClient } from 'usehooks-ts'

import { cn } from '@/utils/style'

import {
  AvatarFallback,
  AvatarImage,
  Avatar as AvatarRoot,
} from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  name?: string
  image?: string | null
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackClassName?: string
}

const Avatar: FC<Props> = ({
  name,
  image,
  alt,
  size = 'md',
  className,
  fallbackClassName,
}) => {
  const isClient = useIsClient()

  const [first, second] = (name || '')?.split(' ')
  const fallback =
    `${first ? first?.[0] : ''}${second && size !== 'xs' ? second?.[0] : ''}`?.toUpperCase()

  return (
    <AvatarRoot
      className={cn([
        // 'rounded-md',
        size === 'xs' && 'size-6',
        size === 'sm' && 'size-8',
        size === 'md' && 'size-10',
        size === 'lg' && 'size-12',
        size === 'xl' && 'size-16',
        className,
      ])}
    >
      {isClient ? (
        <>
          <AvatarImage src={image || ''} alt={alt || name} />
          <AvatarFallback
            className={cn([
              // 'rounded-md',
              'bg-white',
              size === 'xs' && 'text-sm',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-base',
              size === 'lg' && 'text-lg',
              size === 'xl' && 'text-xl',
              fallbackClassName,
            ])}
          >
            {fallback}
          </AvatarFallback>
        </>
      ) : (
        <Skeleton
          className={cn([
            // 'rounded-md',
            size === 'xs' && 'size-6',
            size === 'sm' && 'size-8',
            size === 'md' && 'size-10',
            size === 'lg' && 'size-12',
            size === 'xl' && 'size-16',
            className,
          ])}
        />
      )}
    </AvatarRoot>
  )
}

export default Avatar
