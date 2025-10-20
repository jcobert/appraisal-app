'use client'

import { AppProgressProvider, AppProgressProviderProps } from '@bprogress/next'
import { FC } from 'react'

import { brandColors } from '@repo/tailwind-config/colors'

const ProgressProvider: FC<AppProgressProviderProps> = ({
  children,
  ...props
}) => {
  return (
    <AppProgressProvider
      color={brandColors['brand-light']}
      options={{ showSpinner: false }}
      shallowRouting
      {...props}
    >
      {children}
    </AppProgressProvider>
  )
}

export default ProgressProvider
