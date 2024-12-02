import { FC, ReactNode } from 'react'

import { cn } from '@/utils/style'

import Heading from '@/components/layout/heading'

export type PageLayoutProps = {
  heading?: string | JSX.Element
  children?: ReactNode
  className?: string
  defaultLayout?: boolean
  mainClassName?: string
  backgroundImage?: string
  pageClassName?: string
}

const PageLayout: FC<PageLayoutProps> = ({
  heading,
  children,
  className = '',
  defaultLayout = true,
  mainClassName = '',
  backgroundImage,
  pageClassName = '',
}) => {
  const pageHeading =
    typeof heading === 'string' ? <Heading text={heading} /> : heading

  return (
    <main className={cn(['h-full', mainClassName])}>
      {backgroundImage ? (
        <div
          className='absolute h-dvh w-full bg-fixed bg-no-repeat bg-cover bg-center before:absolute before:w-full before:h-dvh before:bg-[#0000006c]'
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : null}

      <div
        className={cn([
          'items-center justify-start pb-safe',
          !!backgroundImage && 'relative',
        ])}
      >
        <div
          className={cn([
            'flex flex-col gap-2',
            defaultLayout && 'layout py-6',
            pageClassName,
          ])}
        >
          {heading ? pageHeading : null}

          <div className={cn(['px-2', className])}>{children}</div>
        </div>
      </div>
    </main>
  )
}

export default PageLayout
