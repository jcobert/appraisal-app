'use client'

/* eslint-disable @next/next/no-img-element */
import { FC, useState } from 'react'

import { cn } from '@/utils/style'

type Props = {
  name?: string
  image?: string | null
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  textClassName?: string
}

const Fallback: FC<Props> = ({ className, size, textClassName, name }) => (
  <div
    className={cn(
      'flex-none rounded-full bg-gray-100 border flex justify-center items-center',
      [
        size === '2xs' && 'size-8',
        size === 'xs' && 'size-12',
        size === 'sm' && 'size-16',
        size === 'md' && 'size-20',
        size === 'lg' && 'size-24',
        size === 'xl' && 'size-28',
        className,
      ],
    )}
  >
    <div
      className={cn('text-gray-500', [
        size === '2xs' && 'text-2xl',
        size === 'xs' && 'text-3xl',
        size === 'sm' && 'text-4xl',
        size === 'md' && 'text-4xl',
        size === 'lg' && 'text-5xl',
        size === 'xl' && 'text-5xl',
        textClassName,
      ])}
    >
      {(name?.[0] || '')?.toUpperCase()}
    </div>
  </div>
)

const Avatar: FC<Props> = (props) => {
  const { name, image, size = 'md', className } = props

  const [imageLoaded, setImageLoaded] = useState(false)

  if (!name)
    return (
      <div
        className={cn('flex-none rounded-full bg-gray-100 border', [
          size === '2xs' && 'size-8',
          size === 'xs' && 'size-12',
          size === 'sm' && 'size-16',
          size === 'md' && 'size-20',
          size === 'lg' && 'size-24',
          size === 'xl' && 'size-28',
          className,
        ])}
      />
    )

  return image ? (
    <>
      <img
        className='hidden'
        src={image}
        alt={name}
        onLoad={() => {
          setImageLoaded(true)
        }}
      />
      {imageLoaded ? (
        <img
          className={cn('flex-none rounded-full bg-gray-100 border', [
            size === '2xs' && 'size-8',
            size === 'xs' && 'size-12',
            size === 'sm' && 'size-16',
            size === 'md' && 'size-20',
            size === 'lg' && 'size-24',
            size === 'xl' && 'size-28',
            className,
          ])}
          src={image}
          alt={name}
        />
      ) : (
        <Fallback {...props} />
      )}
    </>
  ) : (
    <Fallback {...props} />
  )
}

export default Avatar
