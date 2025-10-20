'use client'

import { AppProgressProvider, AppProgressProviderProps } from '@bprogress/next'
import { FC } from 'react'
import twConfig from 'tailwind.config'

const ProgressProvider: FC<AppProgressProviderProps> = ({
  children,
  ...props
}) => {
  return (
    <AppProgressProvider
      color={twConfig.theme.extend.colors['brand-light']}
      options={{ showSpinner: false }}
      shallowRouting
      {...props}
    >
      {children}
    </AppProgressProvider>
  )
}

export default ProgressProvider
