import { FC } from 'react'

import { cn } from '@/utils/style'

import {
  AvatarFallback,
  AvatarImage,
  Avatar as AvatarRoot,
} from '@/components/ui/avatar'

type Props = {
  name?: string
  image?: string | null
  alt?: string
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  textClassName?: string
}

const Avatar: FC<Props> = (props) => {
  const { name, image, alt, size = 'md', className } = props

  const [first, second] = (name || '')?.split(' ')
  const fallback = `${first?.[0]}${second?.[0]}`?.toUpperCase()

  return (
    <AvatarRoot
      className={cn([
        size === '2xs' && 'size-4',
        size === 'xs' && 'size-6',
        size === 'sm' && 'size-8',
        size === 'md' && 'size-10',
        size === 'lg' && 'size-12',
        size === 'xl' && 'size-16',
        className,
      ])}
    >
      <AvatarImage src={image || ''} alt={alt} />
      <AvatarFallback
        className={cn([
          size === '2xs' && 'text-2xs',
          size === 'xs' && 'text-xs',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg',
          size === 'xl' && 'text-xl',
        ])}
      >
        {fallback}
      </AvatarFallback>
    </AvatarRoot>
  )
}

export default Avatar
