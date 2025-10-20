import { ComponentPropsWithoutRef, FC, ReactNode } from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui/ui/sheet'

export type DrawerProps = {
  children?: ReactNode
  trigger?: ReactNode
  className?: string
  title?: ReactNode
  description?: string
  preventOutsideClose?: boolean
} & Omit<ComponentPropsWithoutRef<typeof Sheet>, 'children'> &
  Pick<ComponentPropsWithoutRef<typeof SheetContent>, 'side'>

const Drawer: FC<DrawerProps> = ({
  children,
  trigger,
  className,
  title,
  description,
  preventOutsideClose = false,
  side,
  ...rootProps
}) => {
  return (
    <>
      <Sheet {...rootProps}>
        {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
        <SheetContent
          onInteractOutside={(e) => {
            if (preventOutsideClose) {
              e.preventDefault()
            }
          }}
          onEscapeKeyDown={(e) => {
            if (preventOutsideClose) {
              e.preventDefault()
            }
          }}
          side={side}
          className={className}
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription className='sr-only'>
              {description}
            </SheetDescription>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    </>
  )
}

export default Drawer
