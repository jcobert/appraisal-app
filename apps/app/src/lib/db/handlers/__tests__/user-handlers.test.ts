/**
 * @jest-environment node
 */
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { User } from '@prisma/client'

import { db } from '@/lib/db/client'
import {
  handleCreateUserProfile,
  handleDeleteUserProfile,
  handleGetActiveUserProfile,
  handleGetUserProfile,
  handleRegisterUser,
  handleUpdateActiveUserProfile,
  handleUpdateUserProfile,
} from '@/lib/db/handlers/user-handlers'
import {
  updateAuthAccount,
  updateAuthEmail,
} from '@/lib/kinde-management/queries'

import { isAuthenticated } from '@/utils/auth'
import { validatePayload } from '@/utils/zod'

import { SessionUser } from '@/types/auth'

import { getProfileChanges } from '@/features/user/utils'

jest.mock('@/utils/auth', () => ({
  isAuthenticated: jest.fn(),
}))

jest.mock('@/lib/db/client', () => ({
  db: {
    user: {
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/utils/zod', () => ({
  ...jest.requireActual('@/utils/zod'),
  validatePayload: jest.fn(),
}))

// Mock the api-handlers module
jest.mock('@/lib/db/api-handlers', () => ({
  ...jest.requireActual('@/lib/db/api-handlers'),
}))

// Mock Kinde management and user utilities
jest.mock('@/lib/kinde-management/queries', () => ({
  updateAuthAccount: jest.fn(),
  updateAuthEmail: jest.fn(),
}))

jest.mock('@/features/user/utils', () => ({
  getProfileChanges: jest.fn(),
}))

jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: jest.fn(),
}))

// Typed mocks
const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>
const mockDb = db as jest.Mocked<typeof db>
const mockValidatePayload = validatePayload as jest.MockedFunction<
  typeof validatePayload
>
const mockUpdateAuthAccount = updateAuthAccount as jest.MockedFunction<
  typeof updateAuthAccount
>
const mockUpdateAuthEmail = updateAuthEmail as jest.MockedFunction<
  typeof updateAuthEmail
>
const mockGetProfileChanges = getProfileChanges as jest.MockedFunction<
  typeof getProfileChanges
>
const mockGetKindeServerSession = getKindeServerSession as jest.MockedFunction<
  typeof getKindeServerSession
>

describe('user-handlers', () => {
  const mockUser: SessionUser = {
    id: 'user-123',
    email: 'test@example.com',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/avatar.jpg',
  }

  const mockUserProfile: User = {
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

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock for authentication
    mockIsAuthenticated.mockResolvedValue({
      allowed: true,
      user: mockUser,
    })

    // Default mock for validation - return the input payload as sanitized data
    mockValidatePayload.mockImplementation((schema, payload) => ({
      success: true,
      data: payload, // Mock returns the payload as if it was sanitized
      errors: null,
    }))

    // Default mocks for user profile ID lookup - ensure createApiHandler can resolve profile ID
    ;(mockDb.user.findUnique as jest.Mock).mockImplementation((query) => {
      // If this is the profile ID lookup query (by accountId)
      if (query.where?.accountId) {
        return Promise.resolve({ id: 'user-profile-123' })
      }
      // Otherwise return null for other queries (will be overridden in specific tests)
      return Promise.resolve(null)
    })

    // Default mocks for additional dependencies
    mockGetProfileChanges.mockReturnValue({})
    mockUpdateAuthAccount.mockResolvedValue({ success: true } as any)
    mockUpdateAuthEmail.mockResolvedValue({ success: true } as any)
    mockGetKindeServerSession.mockReturnValue({
      refreshTokens: jest.fn(),
    } as any)

    // Mock database operations
    ;(mockDb.user.update as jest.Mock).mockResolvedValue(mockUserProfile)
    ;(mockDb.user.create as jest.Mock).mockResolvedValue(mockUserProfile)
  })

  describe('handleGetActiveUserProfile', () => {
    it('should return active user profile successfully', async () => {
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(mockUserProfile)

      const result = await handleGetActiveUserProfile()

      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockUserProfile)
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { accountId: mockUser.id },
      })
    })

    it('should return 404 when no active user profile found', async () => {
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await handleGetActiveUserProfile()

      expect(result.status).toBe(404)
      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('NOT_FOUND')
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { accountId: mockUser.id },
      })
    })

    it('should handle authentication failure', async () => {
      mockIsAuthenticated.mockResolvedValue({
        allowed: false,
        user: null,
      })

      const result = await handleGetActiveUserProfile()

      expect(result.status).toBe(401)
      expect(result.error?.code).toBe('NOT_AUTHENTICATED')
    })
  })

  describe('handleGetUserProfile', () => {
    it('should return user by ID successfully', async () => {
      const userId = 'user-profile-123'
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(mockUserProfile)

      const result = await handleGetUserProfile(userId)

      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockUserProfile)
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })
    })

    it('should return 404 when user not found', async () => {
      const userId = 'nonexistent-user'
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await handleGetUserProfile(userId)

      expect(result.status).toBe(404)
      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('NOT_FOUND')
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })
    })

    it('should handle missing user ID', async () => {
      const result = await handleGetUserProfile('')

      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('INVALID_DATA')
      expect(result.error?.message).toBe('User ID is required.')
    })

    it('should handle authentication failure', async () => {
      mockIsAuthenticated.mockResolvedValue({
        allowed: false,
        user: null,
      })

      const result = await handleGetUserProfile('user-123')

      expect(result.status).toBe(401)
      expect(result.error?.code).toBe('NOT_AUTHENTICATED')
    })
  })

  describe('handleRegisterUser', () => {
    it('should register a new user profile successfully', async () => {
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(mockDb.user.create as jest.Mock).mockResolvedValue(mockUserProfile)

      const result = await handleRegisterUser()

      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockUserProfile)
      expect(result.message).toBe('User profile created successfully.')
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { accountId: mockUser.id },
        select: { id: true },
      })
      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: {
          accountId: mockUser.id,
          createdBy: mockUser.id,
          updatedBy: mockUser.id,
          firstName: mockUser.given_name,
          lastName: mockUser.family_name,
          avatar: mockUser.picture,
          email: mockUser.email,
          phone: mockUser.phone_number,
        },
        select: { id: true },
      })
    })

    it('should handle case when user profile already exists', async () => {
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(mockUserProfile)

      const result = await handleRegisterUser()

      expect(result.status).toBe(409)
      expect(result.error?.code).toBe('DUPLICATE')
      expect(result.error?.message).toBe(
        'A profile for this account already exists.',
      )
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { accountId: mockUser.id },
        select: { id: true },
      })
      expect(mockDb.user.create).not.toHaveBeenCalled()
    })

    it('should handle authentication failure', async () => {
      mockIsAuthenticated.mockResolvedValue({
        allowed: false,
        user: null,
      })

      const result = await handleRegisterUser()

      expect(result.status).toBe(401)
      expect(result.error?.code).toBe('NOT_AUTHENTICATED')
    })

    it('should handle database errors', async () => {
      ;(mockDb.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      )

      const result = await handleRegisterUser()

      expect(result.status).toBe(500)
      expect(result.error?.code).toBe('INTERNAL_ERROR')
    })

    it('should handle missing user data gracefully', async () => {
      const userWithMissingFields = {
        ...mockUser,
        given_name: null,
        family_name: null,
        picture: null,
        phone_number: null,
      }

      mockIsAuthenticated.mockResolvedValue({
        allowed: true,
        user: userWithMissingFields,
      })
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(mockDb.user.create as jest.Mock).mockResolvedValue(mockUserProfile)

      const result = await handleRegisterUser()

      expect(result.status).toBe(200)
      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: {
          accountId: userWithMissingFields.id,
          createdBy: userWithMissingFields.id,
          updatedBy: userWithMissingFields.id,
          firstName: '',
          lastName: '',
          avatar: null,
          email: userWithMissingFields.email,
          phone: null,
        },
        select: { id: true },
      })
    })
  })

  describe('handleCreateUserProfile', () => {
    const createPayload = {
      accountId: 'user-456',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
    }

    it('should create user successfully', async () => {
      const createdUser = { ...mockUserProfile, ...createPayload }
      ;(mockDb.user.create as jest.Mock).mockResolvedValue(createdUser)

      const result = await handleCreateUserProfile(createPayload)

      expect(result.status).toBe(200)
      expect(result.data).toEqual(createdUser)
      expect(result.message).toBe('User created successfully.')
      expect(mockValidatePayload).toHaveBeenCalledWith(
        expect.any(Object),
        createPayload,
        { passthrough: true },
      )

      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: {
          // Only the schema-validated fields (no accountId from payload)
          firstName: createPayload.firstName,
          lastName: createPayload.lastName,
          email: createPayload.email,
          phone: createPayload.phone,
          // Plus system-added fields
          accountId: mockUser.id, // Set from auth context, not user input
          createdBy: mockUser.id,
          updatedBy: mockUser.id,
        },
      })
    })

    it('should handle validation errors', async () => {
      const invalidPayload = {
        firstName: '',
        lastName: '',
        email: 'invalid',
        accountId: 'user-456',
      }
      mockValidatePayload.mockReturnValue({
        success: false,
        data: {},
        errors: {
          firstName: { code: 'too_small', message: 'First name is required' },
          lastName: { code: 'too_small', message: 'Last name is required' },
          email: { code: 'invalid_string', message: 'Invalid email format' },
        },
      })

      const result = await handleCreateUserProfile(invalidPayload)

      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('INVALID_DATA')
      expect(result.error?.message).toBe('Invalid data provided.')
      expect(result.error?.details).toEqual({
        firstName: { code: 'too_small', message: 'First name is required' },
        lastName: { code: 'too_small', message: 'Last name is required' },
        email: { code: 'invalid_string', message: 'Invalid email format' },
      })
    })

    it('should handle authentication failure', async () => {
      mockIsAuthenticated.mockResolvedValue({
        allowed: false,
        user: null,
      })

      const result = await handleCreateUserProfile(createPayload)

      expect(result.status).toBe(401)
      expect(result.error?.code).toBe('NOT_AUTHENTICATED')
    })

    it('should handle database errors', async () => {
      ;(mockDb.user.create as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      )

      const result = await handleCreateUserProfile(createPayload)

      expect(result.status).toBe(500)
      expect(result.error?.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('handleUpdateUserProfile', () => {
    const userId = 'user-profile-123'
    const updatePayload = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '987-654-3210',
    }

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUserProfile, ...updatePayload }
      ;(mockDb.user.update as jest.Mock).mockResolvedValue(updatedUser)

      const result = await handleUpdateUserProfile(userId, updatePayload)

      expect(result.status).toBe(200)
      expect(result.data).toEqual(updatedUser)
      expect(result.message).toBe('User updated successfully.')
      expect(mockValidatePayload).toHaveBeenCalledWith(
        expect.any(Object),
        updatePayload,
        { passthrough: true },
      )
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          // Schema-validated and sanitized fields
          firstName: updatePayload.firstName,
          lastName: updatePayload.lastName,
          email: updatePayload.email,
          phone: updatePayload.phone,
          // System-added audit field
          updatedBy: mockUserProfile.id, // Now uses profile ID
        },
      })
    })

    it('should handle missing user ID', async () => {
      const result = await handleUpdateUserProfile('', updatePayload)

      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('INVALID_DATA')
      expect(result.error?.message).toBe('User ID is required.')
    })

    it('should handle validation errors', async () => {
      const invalidPayload = { firstName: '', email: 'invalid' }
      mockValidatePayload.mockReturnValue({
        success: false,
        data: {},
        errors: {
          firstName: { code: 'too_small', message: 'First name is required' },
          email: { code: 'invalid_string', message: 'Invalid email format' },
        },
      })

      const result = await handleUpdateUserProfile(userId, invalidPayload)

      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('INVALID_DATA')
      expect(result.error?.details).toEqual({
        firstName: { code: 'too_small', message: 'First name is required' },
        email: { code: 'invalid_string', message: 'Invalid email format' },
      })
    })

    it('should handle authentication failure', async () => {
      mockIsAuthenticated.mockResolvedValue({
        allowed: false,
        user: null,
      })

      const result = await handleUpdateUserProfile(userId, updatePayload)

      expect(result.status).toBe(401)
      expect(result.error?.code).toBe('NOT_AUTHENTICATED')
    })

    it('should handle database errors', async () => {
      ;(mockDb.user.update as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      )

      const result = await handleUpdateUserProfile(userId, updatePayload)

      expect(result.status).toBe(500)
      expect(result.error?.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('handleDeleteUserProfile', () => {
    const userId = 'user-profile-123'

    it('should delete user successfully', async () => {
      ;(mockDb.user.delete as jest.Mock).mockResolvedValue(mockUserProfile)

      const result = await handleDeleteUserProfile(userId)

      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockUserProfile)
      expect(result.message).toBe('User deleted successfully.')
      expect(mockDb.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      })
    })

    it('should handle missing user ID', async () => {
      const result = await handleDeleteUserProfile('')

      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('INVALID_DATA')
      expect(result.error?.message).toBe('User ID is required.')
    })

    it('should handle authentication failure', async () => {
      mockIsAuthenticated.mockResolvedValue({
        allowed: false,
        user: null,
      })

      const result = await handleDeleteUserProfile(userId)

      expect(result.status).toBe(401)
      expect(result.error?.code).toBe('NOT_AUTHENTICATED')
    })

    it('should handle database errors', async () => {
      ;(mockDb.user.delete as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      )

      const result = await handleDeleteUserProfile(userId)

      expect(result.status).toBe(500)
      expect(result.error?.code).toBe('INTERNAL_ERROR')
    })

    it('should handle user not found during deletion', async () => {
      ;(mockDb.user.delete as jest.Mock).mockRejectedValue(
        new Error('Record to delete does not exist.'),
      )

      const result = await handleDeleteUserProfile(userId)

      expect(result.status).toBe(500)
      expect(result.error?.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('handleUpdateActiveUserProfile', () => {
    it('should update active user profile successfully', async () => {
      const payload = {
        accountId: mockUser.id,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      }

      mockValidatePayload.mockReturnValue({
        success: true,
        data: payload,
        errors: {},
      })
      ;(mockDb.user.update as jest.Mock).mockResolvedValue(mockUserProfile)

      const result = await handleUpdateActiveUserProfile(payload)

      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockUserProfile)
      expect(mockValidatePayload).toHaveBeenCalled()
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { accountId: mockUser.id },
        data: expect.objectContaining({
          ...payload,
          email: payload.email,
          updatedBy: mockUserProfile.id, // Now uses profile ID
        }),
        select: { id: true },
      })
    })

    it('should throw AuthorizationError when user not authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

      const result = await handleUpdateActiveUserProfile({})

      expect(result.status).toBe(401)
      expect(result.error?.code).toBe('NOT_AUTHENTICATED')
    })

    it('should throw AuthorizationError when trying to update different user', async () => {
      const payload = { accountId: 'different-account' }
      mockValidatePayload.mockReturnValue({
        success: true,
        data: payload,
        errors: {},
      })

      const result = await handleUpdateActiveUserProfile(payload)

      expect(result.status).toBe(403)
      expect(result.error?.code).toBe('NOT_AUTHORIZED')
    })

    it('should throw ValidationError when payload is invalid', async () => {
      const payload = { email: 'invalid-email' }
      mockValidatePayload.mockReturnValue({
        success: false,
        data: {},
        errors: { email: { code: 'invalid_string', message: 'Invalid email' } },
      })

      const result = await handleUpdateActiveUserProfile(payload)

      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('INVALID_DATA')
    })

    it('should handle database update failure', async () => {
      const payload = { accountId: mockUser.id }

      mockValidatePayload.mockReturnValue({
        success: true,
        data: payload,
        errors: {},
      })
      ;(mockDb.user.update as jest.Mock).mockResolvedValue(null)

      const result = await handleUpdateActiveUserProfile(payload)

      expect(result.status).toBe(500)
      expect(result.error?.code).toBe('INTERNAL_ERROR')
    })
  })
})
