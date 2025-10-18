import { FC } from 'react'

import { cn } from '@/utils/style'

type Props = {
  /** File path or URL of image. */
  backgroundImage?: string
  className?: string
  /** Applies an overlay that dims/darkens the image. Default is `true`. */
  dimmed?: boolean
}

const BackgroundImage: FC<Props> = ({
  backgroundImage,
  className,
  dimmed = true,
}) => {
  if (!backgroundImage) return null
  return (
    <div
      className={cn(
        'absolute h-dvh w-full bg-fixed bg-no-repeat bg-cover bg-center',
        dimmed &&
          'before:absolute before:w-full before:h-dvh before:bg-[#0000006c]',
        className,
      )}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    />
  )
}

export default BackgroundImage
