'use client'

// import {
//   Navbar,
//   NavbarContent,
//   NavbarMenu,
//   NavbarMenuItem,
//   NavbarMenuToggle,
// } from '@nextui-org/navbar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FC, useState } from 'react'

import { cn } from '@/utils/style'

import AuthLink from '@/components/auth/auth-link'
import Accordion from '@/components/layout/accordion'
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

  return <div></div>
  // return (
  //   <Navbar
  //     disableAnimation
  //     isMenuOpen={isMenuOpen}
  //     onMenuOpenChange={setIsMenuOpen}
  //     isBordered
  //     className={cn(['sm:hidden', className])}
  //     classNames={{ wrapper: 'w-11/12 max-w-[68.75rem] px-2 sm:px-0' }}
  //   >
  //     <NavbarContent className='sm:hidden w-full grid grid-rows-1 grid-cols-12 items-center'>
  //       {/* Logo */}
  //       <LogoLink loggedIn={!!loggedIn} />

  //       {/* Hamburger */}
  //       <NavbarMenuToggle className='col-start-12' />
  //     </NavbarContent>

  //     {/* Menu */}
  //     <NavbarMenu className='px-8 overflow-y-auto pb-16 border-t bg-background/80'>
  //       {/* User */}
  //       {user ? (
  //         <UserGreeting user={user} />
  //       ) : (
  //         <div className='flex flex-col items-center gap-2 mt-4'>
  //           <p className='text-balance'>Ready to get started?</p>
  //           <AuthLink
  //             loggedIn={loggedIn}
  //             type='register'
  //             className='self-center w-full'
  //           />
  //         </div>
  //       )}

  //       {/* Links */}
  //       <div className='flex flex-col gap-6 mt-6 pb-safe mb-24'>
  //         {navItems?.map((item) => {
  //           const hasMenu = !!item?.menu?.links?.length
  //           return (
  //             <NavbarMenuItem
  //               key={item?.id}
  //               className='text-right text-xl border-b border-brand-gray-medium/15 pb-2 flex justify-end text-dark-gray data-[active="true"]:text-brand'
  //               isActive={isActive(item, pathname)}
  //             >
  //               {!hasMenu ? (
  //                 <Link
  //                   className='w-full font-semibold py-2'
  //                   href={item?.url}
  //                   onClick={() => setIsMenuOpen(false)}
  //                 >
  //                   {item?.name}
  //                 </Link>
  //               ) : (
  //                 <Accordion
  //                   collapsible
  //                   className='border-none pr-0 w-full'
  //                   triggerClassName='!justify-end font-semibold text-brand-gray-dark data-[state=open]:text-brand'
  //                   itemClassName='!p-0'
  //                   items={[
  //                     {
  //                       header: item?.name,
  //                       content: (
  //                         <div className='flex flex-col gap-8 bg-almost-white/40__ py-4 pr-6_ rounded border__ border-brand-gray-light/30'>
  //                           {!!item?.url && (
  //                             <Link
  //                               key={`${item?.id}-menu`}
  //                               className='w-full font-medium text-brand-gray-dark pr-8'
  //                               href={item?.url}
  //                               onClick={() => setIsMenuOpen(false)}
  //                             >
  //                               {`All ${item?.name}`}
  //                             </Link>
  //                           )}
  //                           {item?.menu?.links?.map((link) => (
  //                             <Link
  //                               key={link?.id}
  //                               className='w-full font-medium text-brand-gray-dark pr-8'
  //                               href={link?.url}
  //                               onClick={() => setIsMenuOpen(false)}
  //                             >
  //                               {link?.name}
  //                             </Link>
  //                           ))}
  //                         </div>
  //                       ),
  //                     },
  //                   ]}
  //                 />
  //               )}
  //             </NavbarMenuItem>
  //           )
  //         })}
  //       </div>

  //       <div className='mt-auto flex flex-col items-center gap-2'>
  //         <p className='text-balance'>Already have an account?</p>
  //         <AuthLink loggedIn={loggedIn} />
  //       </div>
  //     </NavbarMenu>
  //   </Navbar>
  // )
}

export default MobileNav
