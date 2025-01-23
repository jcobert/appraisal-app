'use client'

import { DefaultOptions, QueryClientProvider } from '@tanstack/react-query'
import React, { FC, ReactNode, useState } from 'react'

import { createQueryClient } from '@/utils/query'

export const defaultQueryOptions: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false,
  },
}

const QueryProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [queryClient] = useState(() => createQueryClient())
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

export default QueryProvider
