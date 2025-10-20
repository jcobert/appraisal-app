import React, { ComponentPropsWithoutRef, FC, Fragment, ReactNode } from 'react'

import { cn } from '@/utils/style'

import StickyContainer, {
  StickyContainerProps,
} from '@/components/general/sticky-container'
import { Button, ButtonProps } from '@/components/ui/button'

export type FormAction = {
  /** Unique identifier for this action. Used as content of button if `content` prop not provided. */
  name: string
  /** Content to display within action button. If omitted, `name` prop value will be used. */
  content?: ReactNode
} & Omit<ButtonProps, 'name'>

export type FormActionBarProps = {
  children?: ReactNode
  /**
   * Applies special positioning of the action bar.
   * - `"sticky"` - Arranged in flow and then sticks to bottom of page.
   * - `"fixed"` - Always stuck to bottom of page.
   * - `"normal"` - No positioning applied. Maintains normal position in flow.
   * @default "normal"
   */
  position?: 'sticky' | 'fixed' | 'normal'
  /** Props passed to the sticky container. Only applies when `position` is `"sticky"` or `"fixed"`. */
  containerProps?: StickyContainerProps
  /** Actions to be rendered as buttons within the action bar. */
  actions?: FormAction[]
  className?: string
}

const FormActionBar: FC<FormActionBarProps> = ({
  children,
  actions,
  position = 'normal',
  containerProps,
  className,
}) => {
  const positioned = position !== 'normal'
  const Comp = positioned ? StickyContainer : Fragment

  const wrapperClassName = 'flex items-center justify-end w-full gap-6'

  const actionBarProps = {
    ...(positioned
      ? ({
          interceptClassName: 'h-full',
          targetClassName:
            position === 'fixed' ? 'border-t border-border-alt' : '',
          fixed: position === 'fixed',
          ...containerProps,
        } satisfies ComponentPropsWithoutRef<typeof StickyContainer>)
      : {}),
  }

  if (actions?.length) {
    return (
      <Comp {...actionBarProps}>
        <div
          className={cn(wrapperClassName, { 'pt-4': positioned }, className)}
        >
          {actions?.map(({ name, content, className: cls, ...buttonProps }) => (
            <Button
              key={name}
              className={cn('w-full md:w-fit', cls)}
              variant='ghost'
              {...buttonProps}
            >
              {content || name}
            </Button>
          ))}
        </div>
      </Comp>
    )
  }

  if (!children) return null

  return (
    <Comp {...actionBarProps}>
      <div className={cn(wrapperClassName, { 'pt-4': positioned }, className)}>
        {children}
      </div>
    </Comp>
  )
}

export default FormActionBar
