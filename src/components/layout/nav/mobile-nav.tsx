'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FC, useState } from 'react'
import { CgClose } from 'react-icons/cg'
import { RxHamburgerMenu } from 'react-icons/rx'

import { cn } from '@/utils/style'

import AuthLink from '@/components/auth/auth-link'
import Accordion from '@/components/layout/accordion'
import Drawer from '@/components/layout/drawer'
import UserGreeting from '@/components/layout/header/user-greeting'
import LogoLink from '@/components/layout/nav/logo-link'

import { SessionData } from '@/types/auth'

import { isActive, navItems } from '@/configuration/nav'

type Props = {
  sessionData: Partial<SessionData>
  className?: string
}

const MobileNav: FC<Props> = ({
  className,
  sessionData: { user, loggedIn },
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div
      id='mobile-navbar'
      className={cn([
        'md:hidden',
        'border-b border-gray-200 shadow-sm sticky top-0 bg-almost-white/50 backdrop-blur-lg',
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
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        overlay={false}
        closeButton={false}
      >
        <div
          className={cn(
            'w-full p-4 flex items-center',
            'border-b border-gray-200 shadow-sm py-2 sticky top-0 bg-almost-white/50 backdrop-blur-lg',
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
            <CgClose className='text-3xl rounded' />
          </button>
        </div>

        <div className='px-8 pt-4 overflow-y-auto pb-16 h-dvh flex flex-col'>
          {/* User */}
          {user ? (
            <UserGreeting user={user} />
          ) : (
            <div className='flex flex-col items-center gap-2 mt-4'>
              <p className='text-balance'>Ready to get started?</p>
              <AuthLink
                loggedIn={loggedIn}
                type='register'
                className='self-center w-full'
              />
            </div>
          )}

          {/* Links */}
          <div className='flex flex-col gap-6 mt-6 pb-safe flex-1'>
            {navItems?.map((item) => {
              const hasMenu = !!item?.menu?.links?.length
              return (
                <div
                  key={item?.id}
                  className={cn([
                    'text-right text-xl border-b border-medium-gray/15 pb-2 flex justify-end text-dark-gray',
                    isActive(item, pathname) && 'text-brand',
                  ])}
                >
                  {!hasMenu ? (
                    <Link
                      className='w-full font-semibold py-2'
                      href={item?.url}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item?.name}
                    </Link>
                  ) : (
                    <Accordion
                      collapsible
                      className='border-none pr-0 w-full'
                      triggerClassName={cn([
                        '!justify-end font-semibold text-dark-gray',
                        isMenuOpen && 'text-brand',
                      ])}
                      itemClassName='!p-0'
                      items={[
                        {
                          header: item?.name,
                          content: (
                            <div className='flex flex-col gap-8 py-4 rounded'>
                              {!!item?.url && (
                                <Link
                                  key={`${item?.id}-menu`}
                                  className='w-full font-medium text-dark-gray pr-8'
                                  href={item?.url}
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {`All ${item?.name}`}
                                </Link>
                              )}
                              {item?.menu?.links?.map((link) => (
                                <Link
                                  key={link?.id}
                                  className='w-full font-medium text-dark-gray pr-8'
                                  href={link?.url}
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {link?.name}
                                </Link>
                              ))}
                            </div>
                          ),
                        },
                      ]}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className='mt-auto__ flex flex-col items-center gap-2'>
            <p className='text-balance'>Already have an account?</p>
            <AuthLink loggedIn={loggedIn} />
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default MobileNav
