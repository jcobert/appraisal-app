import { FC, ReactNode } from 'react'

import { cn } from '@/utils/style'

import BackgroundImage from '@/components/layout/background-image'
import Heading from '@/components/layout/heading'

export type PageLayoutProps = {
  heading?: string | JSX.Element
  children?: ReactNode
  defaultLayout?: boolean
  backgroundImage?: string
  className?: string
  mainClassName?: string
  pageClassName?: string
  backgroundImageClassName?: string
}

const PageLayout: FC<PageLayoutProps> = ({
  heading,
  children,
  defaultLayout = true,
  backgroundImage,
  className,
  mainClassName,
  pageClassName,
  backgroundImageClassName,
}) => {
  const pageHeading =
    typeof heading === 'string' ? <Heading text={heading} /> : heading

  return (
    <main className={cn(['h-full', mainClassName])}>
      {backgroundImage ? (
        <BackgroundImage
          backgroundImage={backgroundImage}
          /** You might want to apply a margin here to offset a fixed header for example. */
          className={backgroundImageClassName}
        />
      ) : null}

      <div
        className={cn([
          'items-center justify-start pb-safe h-full',
          !!backgroundImage && 'relative',
        ])}
      >
        <div
          className={cn([
            'flex flex-col gap-2 h-full',
            defaultLayout && 'layout py-6 md:py-10',
            pageClassName,
          ])}
        >
          {heading ? pageHeading : null}
          <div className={cn('h-full sm:pb-8', className)}>{children}</div>
        </div>
      </div>
    </main>
  )
}

export default PageLayout
