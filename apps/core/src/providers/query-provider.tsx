'use client'

import { DefaultOptions, QueryClientProvider } from '@tanstack/react-query'
import React, { FC, ReactNode, useEffect, useState } from 'react'

import { createQueryClient } from '@/utils/query'

// Required for query dev tools.
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: any
  }
}

export const defaultQueryOptions: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false,
  },
}

const QueryProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [queryClient] = useState(() => createQueryClient())

  // Connects Chrome query dev tools.
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined'
    ) {
      window.__TANSTACK_QUERY_CLIENT__ = queryClient
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

export default QueryProvider
