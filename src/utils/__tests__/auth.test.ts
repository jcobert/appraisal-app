import { authUrl, isAuthenticated } from '@/utils/auth'

import { SessionUser } from '@/types/auth'

// Mock Kinde auth
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: jest.fn(() => ({
    isAuthenticated: async () => true,
    getUser: async () => ({
      id: 'user_123',
      email: 'test@example.com',
      given_name: 'Test',
      family_name: 'User',
    }),
  })),
}))

describe('auth utils', () => {
  const mockUser: SessionUser = {
    id: 'user_123',
    email: 'test@example.com',
    given_name: 'Test',
    family_name: 'User',
    picture: '',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isAuthenticated', () => {
    it('should return allowed=true when user is authenticated', async () => {
      const getKindeServerSession = jest.requireMock(
        '@kinde-oss/kinde-auth-nextjs/server',
      ).getKindeServerSession
      getKindeServerSession.mockImplementation(() => ({
        isAuthenticated: jest.fn().mockResolvedValue(true),
        getUser: jest.fn().mockResolvedValue(mockUser),
      }))

      const result = await isAuthenticated()
      expect(result).toEqual({ allowed: true, user: mockUser })
    })

    it('should return allowed=false when user is not authenticated', async () => {
      const getKindeServerSession = jest.requireMock(
        '@kinde-oss/kinde-auth-nextjs/server',
      ).getKindeServerSession
      getKindeServerSession.mockImplementation(() => ({
        isAuthenticated: jest.fn().mockResolvedValue(false),
        getUser: jest.fn().mockResolvedValue(null),
      }))

      const result = await isAuthenticated()
      expect(result).toEqual({ allowed: false, user: null })
    })
  })

  describe('authUrl', () => {
    it('should generate login URL with redirect', () => {
      const redirectTo = '/dashboard'
      const result = authUrl({ type: 'login', redirectTo })
      expect(result).toBe(
        '/api/auth/login?post_login_redirect_url=%2Fdashboard',
      )
    })

    it('should generate logout URL with redirect', () => {
      const redirectTo = '/home'
      const result = authUrl({ type: 'logout', redirectTo })
      expect(result).toBe('/api/auth/logout?post_logout_redirect_url=%2Fhome')
    })

    it('should generate absolute URLs when specified', () => {
      process.env.NEXT_PUBLIC_SITE_BASE_URL = 'https://example.com'
      const result = authUrl({ type: 'login', absolute: true })
      expect(result).toBe('https://example.com/api/auth/login')
    })

    it('should throw error when type is missing', () => {
      // @ts-expect-error Testing invalid input
      expect(() => authUrl({ type: null })).toThrow('Missing auth type')
    })
  })
})
