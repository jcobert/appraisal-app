import Page from '../page'
import { redirect } from 'next/navigation'

import { handleRegisterUser } from '@/lib/db/handlers/user-handlers'

import { FetchErrorCode } from '@/utils/fetch'

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/lib/db/handlers/user-handlers', () => ({
  handleRegisterUser: jest.fn(),
}))

// Mock components that aren't relevant to this test
jest.mock('@/components/general/logo', () => {
  return function MockLogo() {
    return <div data-testid='logo' />
  }
})

jest.mock('@/components/layout/full-screen-loader', () => {
  return function MockFullScreenLoader() {
    return <div data-testid='full-screen-loader' />
  }
})

jest.mock('@/components/layout/heading', () => {
  return function MockHeading() {
    return <h1 data-testid='heading' />
  }
})

jest.mock('@repo/ui/button', () => ({
  Button: function MockButton({ children }: { children: React.ReactNode }) {
    return <button data-testid='button'>{children}</button>
  },
}))

jest.mock('next/link', () => {
  return function MockLink({ children }: { children: React.ReactNode }) {
    return <a data-testid='link'>{children}</a>
  }
})

// Typed mocks
const mockHandleRegisterUser = handleRegisterUser as jest.MockedFunction<
  typeof handleRegisterUser
>
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>

// Mock user data
const mockUserProfile = {
  id: 'user-profile-123',
  accountId: 'user-123',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: null,
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-123',
  updatedBy: 'user-123',
}

describe('Welcome Page', () => {
  // Mock page params that Page component expects
  const mockPageProps = {
    params: Promise.resolve({}),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect to dashboard when user profile already exists (DUPLICATE error)', async () => {
    // Mock the handler to return a duplicate error
    mockHandleRegisterUser.mockResolvedValue({
      status: 409,
      data: null,
      error: {
        code: FetchErrorCode.DUPLICATE,
        message: 'A profile for this account already exists.',
      },
    })

    // Call the page component - this should trigger the redirect
    await Page(mockPageProps)

    // Verify that redirect was called with the correct path
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
    expect(mockRedirect).toHaveBeenCalledTimes(1)
  })

  it('should throw error when profile creation returns no data', async () => {
    // Mock the handler to return success but no data
    mockHandleRegisterUser.mockResolvedValue({
      status: 200,
      data: null,
    })

    // Should throw error
    await expect(Page(mockPageProps)).rejects.toThrow(
      'An unexpected error occurred.',
    )
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('should NOT redirect when profile is created successfully', async () => {
    // Mock successful profile creation
    mockHandleRegisterUser.mockResolvedValue({
      status: 200,
      data: mockUserProfile,
      message: 'User profile created successfully.',
    })

    const result = await Page(mockPageProps)

    // Should not redirect
    expect(mockRedirect).not.toHaveBeenCalled()
    // Should render welcome page
    expect(result).toBeDefined()
  })

  it('should throw error on authentication errors', async () => {
    // Mock authentication error
    mockHandleRegisterUser.mockResolvedValue({
      status: 401,
      data: null,
      error: {
        code: FetchErrorCode.NOT_AUTHENTICATED,
        message: 'User not authenticated.',
      },
    })

    await expect(Page(mockPageProps)).rejects.toThrow('User not authenticated.')
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('should throw error on server errors', async () => {
    // Mock server error
    mockHandleRegisterUser.mockResolvedValue({
      status: 500,
      data: null,
      error: {
        code: FetchErrorCode.INTERNAL_ERROR,
        message: 'Internal server error.',
      },
    })

    await expect(Page(mockPageProps)).rejects.toThrow('Internal server error.')
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('should throw error on non-DUPLICATE 409 errors', async () => {
    // Mock a different 409 error that isn't duplicate
    mockHandleRegisterUser.mockResolvedValue({
      status: 409,
      data: null,
      error: {
        code: FetchErrorCode.INVALID_DATA, // Different error code
        message: 'Some other conflict.',
      },
    })

    await expect(Page(mockPageProps)).rejects.toThrow('Some other conflict.')
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('should handle successful profile creation and render welcome content', async () => {
    // Mock successful profile creation
    mockHandleRegisterUser.mockResolvedValue({
      status: 200,
      data: mockUserProfile,
      message: 'User profile created successfully.',
    })

    const result = await Page(mockPageProps)

    // Verify handleRegisterUser was called
    expect(mockHandleRegisterUser).toHaveBeenCalledTimes(1)

    // Should not redirect
    expect(mockRedirect).not.toHaveBeenCalled()

    // Should return JSX content
    expect(result).toBeDefined()
  })
})
