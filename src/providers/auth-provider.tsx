'use client'

import { KindeProvider } from '@kinde-oss/kinde-auth-nextjs'
import { FC, ReactNode } from 'react'

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return <KindeProvider>{children}</KindeProvider>
}
