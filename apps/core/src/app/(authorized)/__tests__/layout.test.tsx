import Layout from '../layout'
import { redirect } from 'next/navigation'

import { handleGetActiveUserProfile } from '@/lib/db/handlers/user-handlers'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode } from '@/utils/fetch'

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: 'some-value' }),
  }),
}))

jest.mock('@/utils/auth', () => ({
  isAuthenticated: jest.fn(),
}))

jest.mock('@/lib/db/handlers/user-handlers', () => ({
  handleGetActiveUserProfile: jest.fn(),
}))

jest.mock('@/lib/db/handlers/organization-handlers', () => ({
  handleGetOrganization: jest.fn(),
  handleGetOrganizationPermissions: jest.fn(),
  handleGetUserOrganizations: jest.fn(),
}))

jest.mock('@/utils/query', () => ({
  createQueryClient: jest.fn().mockReturnValue({
    prefetchQuery: jest.fn(),
  }),
  prefetchQuery: jest.fn(),
  filteredQueryKey: jest.fn(),
}))

jest.mock('@tanstack/react-query', () => ({
  HydrationBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  dehydrate: jest.fn(),
}))

// Mock UI components and providers
jest.mock('@repo/ui', () => ({
  SidebarInset: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

jest.mock('@/providers/breadcrumbs/breadcrumb-provider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/providers/organization-provider', () => ({
  OrganizationProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

jest.mock('@/components/layout/app-nav/app-header', () => ({
  __esModule: true,
  default: () => <div data-testid='app-header' />,
}))

jest.mock('@/components/layout/app-nav/app-sidebar', () => ({
  __esModule: true,
  default: () => <div data-testid='app-sidebar' />,
}))

jest.mock('@/components/layout/page-layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/hooks/use-stored-settings', () => ({
  getActiveOrgCookieName: jest.fn().mockReturnValue('active-org-cookie'),
}))

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>
const mockHandleGetActiveUserProfile =
  handleGetActiveUserProfile as jest.MockedFunction<
    typeof handleGetActiveUserProfile
  >

describe('Authorized Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return null if user is not authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

    const result = await Layout({ children: <div>Child</div> })

    expect(result).toBeNull()
    expect(mockHandleGetActiveUserProfile).not.toHaveBeenCalled()
  })

  it('should redirect to /user/welcome if user profile is not found', async () => {
    mockIsAuthenticated.mockResolvedValue({
      allowed: true,
      user: { id: 'user-123' } as any,
    })

    mockHandleGetActiveUserProfile.mockResolvedValue({
      status: 404,
      data: null,
      error: {
        code: FetchErrorCode.NOT_FOUND,
        message: 'Profile not found',
      },
    })

    await Layout({ children: <div>Child</div> })

    expect(mockRedirect).toHaveBeenCalledWith('/user/welcome')
  })

  it('should NOT redirect if user profile exists', async () => {
    mockIsAuthenticated.mockResolvedValue({
      allowed: true,
      user: { id: 'user-123' } as any,
    })

    mockHandleGetActiveUserProfile.mockResolvedValue({
      status: 200,
      data: { id: 'profile-123' } as any,
    })

    await Layout({ children: <div>Child</div> })

    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
