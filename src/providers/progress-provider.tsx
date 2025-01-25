'use client'

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'
import { FC } from 'react'
import twConfig from 'tailwind.config'

const ProgressProvider: FC = () => {
  return (
    <ProgressBar
      color={twConfig.theme.extend.colors.brand}
      options={{ showSpinner: false }}
    />
  )
}

export default ProgressProvider
