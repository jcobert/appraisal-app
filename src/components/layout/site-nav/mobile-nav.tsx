'use client'

import Link from 'next/link'
import { FC } from 'react'
import { RxHamburgerMenu } from 'react-icons/rx'

import { cn } from '@/utils/style'

import AuthLink from '@/components/auth/auth-link'
import LogoLink from '@/components/general/logo-link'
import Drawer from '@/components/layout/drawer'
import UserGreeting from '@/components/layout/header/user-greeting'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'

import { useNavigationMenu } from '@/hooks/use-navigation'

import { SessionData } from '@/types/auth'

import { SITE_NAVIGATION_ITEMS } from '@/configuration/site-nav'

type Props = {
  sessionData: Partial<SessionData>
  // navItems: NavItem[]
  className?: string
}

const MobileNav: FC<Props> = ({
  sessionData: { loggedIn, profile },
  // navItems,
  className,
}) => {
  const { isActiveItem, isActivePath, isMenuOpen, setIsMenuOpen } =
    useNavigationMenu()

  const navItems = SITE_NAVIGATION_ITEMS

  return (
    <header
      id='mobile-navbar'
      data-open={isMenuOpen}
      className={cn([
        'md:hidden z-50',
        'border-b border-gray-200 dark:border-gray-500 shadow-sm sticky top-0 bg-almost-white/50 backdrop-blur-lg pb-safe',
        className,
      ])}
    >
      <div
        className={cn(
          'w-full p-4 py-2 flex items-center',
          'z-[51]',
          isMenuOpen && 'invisible',
        )}
      >
        {/* Logo */}
        <LogoLink
          className='relative left-[calc(50%-1rem)]'
          loggedIn={!!loggedIn}
        />

        {/* Hamburger */}
        <button
          className='w-fit ml-auto'
          onClick={() => {
            setIsMenuOpen((prev) => !prev)
          }}
        >
          <RxHamburgerMenu className='text-3xl' />
        </button>
      </div>

      {/* Menu */}
      <Drawer
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        className='px-8 pt-4 pb-16 flex flex-col w-10/12'
      >
        {/* <SheetHeader
          className={cn(
            'w-full p-4 flex items-center',
            // 'border-b border-gray-200 dark:border-gray-500 shadow-sm py-2 sticky top-0 bg-almost-white/50 dark:bg-almost-black backdrop-blur-lg',
            'border-b',
          )}
        >
          <LogoLink
            // className='relative left-[calc(50%-1rem)] -top-6'
            loggedIn={!!loggedIn}
            onClickCapture={() => {
              setIsMenuOpen(false)
            }}
          />
        </SheetHeader> */}

        <div className='flex flex-col gap-4 pb-8'>
          {/* User */}
          {profile ? (
            <div className='flex items-center justify-center pb-4'>
              <Link
                className='w-fit'
                href='/user/profile'
                onClick={() => {
                  if (isActivePath('/user/profile')) {
                    setIsMenuOpen(false)
                  }
                }}
              >
                <UserGreeting user={profile} />
              </Link>
            </div>
          ) : (
            <div className='flex flex-col items-center gap-4 mt-4'>
              <p className='text-balance leading-none'>Ready to get started?</p>
              <Button asChild size='lg'>
                <AuthLink loggedIn={loggedIn} type='register' />
              </Button>
            </div>
          )}
          {/* <ThemeSelector className='max-sm:min-w-0' /> */}
        </div>

        {/* Links */}
        <div className='flex flex-col gap-6 my-4 pb-safe flex-1'>
          {navItems?.map((item, i) => {
            const hasMenu = !!item?.menu?.links?.length
            const isLast = i === navItems.length - 1
            const active = isActiveItem(item)
            return (
              <div
                key={item?.id}
                className={cn([
                  'text-right text-xl border-medium-gray/15 pb-2 flex justify-end',
                  active && 'text-brand',
                  !active && 'text-dark-gray dark:text-gray-300',
                  !isLast && 'border-b',
                ])}
              >
                {!hasMenu ? (
                  <Link
                    className='w-full font-semibold py-2'
                    href={item?.url}
                    onClick={() => {
                      if (isActivePath(item?.url)) {
                        setIsMenuOpen(false)
                      }
                    }}
                  >
                    {item?.name}
                  </Link>
                ) : (
                  <>
                    <Accordion type='single' collapsible className='w-full'>
                      <AccordionItem value='1'>
                        <AccordionTrigger
                          className={cn(
                            'text-right justify-end font-semibold text-xl text-dark-gray',
                            'gap-2',
                            isActiveItem(item) && 'text-brand',
                          )}
                        >
                          {item?.name}
                        </AccordionTrigger>
                        <AccordionContent className='flex flex-col gap-8 p-4 rounded'>
                          {!!item?.url ? (
                            <Link
                              key={`${item?.id}-menu`}
                              className='w-full font-medium text-lg text-dark-gray'
                              href={item?.url}
                              onClick={() => {
                                if (isActivePath(item?.url)) {
                                  setIsMenuOpen(false)
                                }
                              }}
                            >
                              {item?.name}
                            </Link>
                          ) : null}
                          {item?.menu?.links?.map((link) => (
                            <Link
                              key={link?.id}
                              className={cn(
                                'w-full font-medium text-lg text-dark-gray',
                                isActivePath(link?.url) && 'text-brand',
                              )}
                              href={link?.url}
                              onClick={() => {
                                if (isActivePath(item?.url)) {
                                  setIsMenuOpen(false)
                                }
                              }}
                            >
                              {link?.name}
                            </Link>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className='flex flex-col items-center gap-4'>
          {!loggedIn ? (
            <p className='text-balance'>Already have an account?</p>
          ) : null}
          <Button asChild variant='outline'>
            <AuthLink loggedIn={loggedIn} />
          </Button>
        </div>
      </Drawer>
    </header>
  )
}

export default MobileNav
