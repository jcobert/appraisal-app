'use client'

import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import Link from 'next/link'
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'

import { cn } from '@repo/utils'

const TabNav = NavigationMenuPrimitive.Root

const TabNavList = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.List>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-9 items-center justify-center rounded-lg text-muted-foreground',
      className,
    )}
    {...props}
  />
))
TabNavList.displayName = NavigationMenuPrimitive.List.displayName

const TabNavLink = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Link>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>(({ className, href, children, active, ...props }, ref) => {
  if (!href) return children
  return (
    <NavigationMenuPrimitive.Link
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-background data-[active]:text-primary',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        className,
      )}
      active={active}
      {...props}
      asChild
    >
      <Link href={href}>
        <span
          className={cn(
            'py-2 px-3 transition',
            'border-b-2 border-transparent',
            !active && 'hover:border-border hover:text-foreground/80',
            active && 'border-b-primary',
          )}
        >
          {children}
        </span>
      </Link>
    </NavigationMenuPrimitive.Link>
  )
})
TabNavLink.displayName = NavigationMenuPrimitive.Link.displayName

export { TabNav, TabNavList, TabNavLink }
