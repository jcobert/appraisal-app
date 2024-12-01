'use client'

import {
  DefaultOptions,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import React, { FC, ReactNode, useState } from 'react'

export const defaultQueryOptions: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false,
  },
}

const QueryProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: defaultQueryOptions,
      }),
  )
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

export default QueryProvider
