import { FC, ReactNode } from 'react'

import { cn } from '@/utils/style'

import Heading from '@/components/layout/heading'

export type PageLayoutProps = {
  heading?: string | JSX.Element
  children?: ReactNode
  className?: string
  defaultLayout?: boolean
}

const PageLayout: FC<PageLayoutProps> = ({
  heading,
  children,
  className = '',
  defaultLayout = true,
}) => {
  const pageHeading =
    typeof heading === 'string' ? (
      <Heading text={heading} className='mt-8' />
    ) : (
      heading
    )

  return (
    <main>
      <div className='items-center justify-start w-screen min-h-screen pb-safe'>
        <div
          className={cn([
            'flex flex-col gap-2 mb-8',
            defaultLayout && 'layout',
          ])}
        >
          {pageHeading}
          <div className={className}>{children}</div>
        </div>
      </div>
    </main>
  )
}

export default PageLayout
