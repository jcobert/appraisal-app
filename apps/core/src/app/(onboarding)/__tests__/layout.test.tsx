import Layout from '../layout'
import { redirect } from 'next/navigation'

import { isAuthenticated } from '@/utils/auth'

import PageLayout from '@/components/layout/page-layout'

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/utils/auth', () => ({
  isAuthenticated: jest.fn(),
}))

jest.mock('@/components/layout/page-layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='page-layout'>{children}</div>
  ),
}))

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>

describe('Onboarding Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect to login if user is not authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

    await Layout({ children: <div>Child</div> })

    expect(mockRedirect).toHaveBeenCalledWith('/api/auth/login')
  })

  it('should render children if user is authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue({
      allowed: true,
      user: { id: 'user-123' } as any,
    })

    const result = await Layout({
      children: <div data-testid='child'>Child</div>,
    })

    expect(result).toEqual(
      <PageLayout mainClassName='h-screen'>
        <div data-testid='child'>Child</div>
      </PageLayout>,
    )
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
