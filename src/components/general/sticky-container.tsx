'use client'

import React, { FC, ReactNode, useRef } from 'react'

import { cn } from '@/utils/style'

import { usePageSize } from '@/hooks/use-page-size'
import {
  UseStyledIntersectionProps,
  useStyledIntersection,
} from '@/hooks/use-styled-intersection'

export type StickyContainerProps = {
  children?: ReactNode
  /** Props passed to the `useStyledIntersection` hook. Top shadow is applied on intersection by default. Override that styling here. */
  intersectionProps?: Omit<UseStyledIntersectionProps, 'targetRef'>
  /** Applied to the container. */
  className?: string
  /** Applied to the contentless target element used for intersection. */
  targetClassName?: string
  /** Applied to the default intercept. Useful for applying margin or padding. */
  interceptClassName?: string
  /**
   * When `true`, does not account for layout elements like the side navbar when determining container width.
   *
   * Useful when using in a drawer or modal that is independent of layout behind it. Default is `false`.
   */
  ignorePageLayout?: boolean
  /** When `true`, no styling will be applied to the container. Defaults to `false`. */
  unstyled?: boolean
  /** When `true`, will fix the container to bottom of page, rather than use sticky positioning. Default is `false`. */
  fixed?: boolean
}

const StickyContainer: FC<StickyContainerProps> = ({
  children,
  intersectionProps,
  className = '',
  targetClassName = '',
  interceptClassName = '',
  ignorePageLayout = false,
  unstyled = false,
  fixed = false,
}) => {
  const targetRef = useRef(null)
  const defaultInterceptRef = useRef(null)

  useStyledIntersection({
    targetRef,
    className: 'top-shadow',
    rootMargin: '-96px',
    ...intersectionProps,
    interceptRef: intersectionProps?.interceptRef ?? defaultInterceptRef,
  })

  const { usableWidth } = usePageSize()

  return (
    <>
      {!intersectionProps?.interceptRef ? (
        <div ref={defaultInterceptRef} className={interceptClassName} />
      ) : null}
      <div
        className={cn({
          'flex flex-col items-center flex-auto gap-4 pb-2 sm:sticky -bottom-1 sm:pb-4 sm:items-end bg-bg-white z-40':
            !unstyled,
          'sm:fixed bottom-0': fixed,
          [className]: !!className,
        })}
      >
        <div
          ref={targetRef}
          className={cn({
            'absolute max-sm:hidden h-full transition-shadow duration-300 shadow-none bg-inherit':
              !unstyled,
            // Offset padding applied from Page container styling.
            // 'lg:-left-10 md:-left-8 sm:-left-4': !ignorePageLayout && !unstyled,
            '-right-6__ !w-screen': ignorePageLayout && !unstyled,
            [targetClassName]: !!targetClassName,
          })}
          style={!unstyled ? { width: usableWidth } : {}}
        />
        {children}
      </div>
    </>
  )
}

export default StickyContainer
