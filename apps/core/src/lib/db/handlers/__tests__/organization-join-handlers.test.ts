/**
 * @jest-environment node
 */
import { createApiHandler, withUserFields } from '../../api-handlers'
import { db } from '../../client'
import {
  AuthenticationError,
  DatabaseConstraintError,
  NotFoundError,
  ValidationError,
} from '../../errors'
import { userIsMember } from '../../queries/organization'
import {
  OrgJoinPayload,
  handleJoinOrganization,
} from '../organization-join-handlers'
import { handleRegisterUser } from '../user-handlers'

import { MemberRole, OrgInvitationStatus } from '@repo/database'

import { getActiveUserAccount } from '@/utils/auth'
import { FetchErrorCode } from '@/utils/fetch'

// Mock isExpired before importing
jest.mock('@repo/utils', () => {
  const actual = jest.requireActual('@repo/utils')
  return {
    ...actual,
    isExpired: jest.fn(),
  }
})

const { isExpired } = require('@repo/utils')

jest.mock('../../api-handlers')
jest.mock('../user-handlers', () => ({
  handleRegisterUser: jest.fn(),
}))
jest.mock('../../client', () => ({
  db: {
    orgInvitation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    orgMember: {
      create: jest.fn(),
    },
  },
}))
jest.mock('../../queries/organization')
jest.mock('@/utils/auth')
jest.mock('@repo/utils', () => ({
  ...jest.requireActual('@repo/utils'),
  isExpired: jest.fn(),
}))
jest.mock('@/components/email/org-invite-notify-owner-email', () => ({
  __esModule: true,
  default: jest.fn(() => '<div>Mocked Email</div>'),
  orgInviteOwnerNotification: jest.fn(() => 'Mocked Subject'),
}))

// Mock Resend properly with a factory function
jest.mock('resend', () => {
  const mockEmailSend = jest.fn()

  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockEmailSend,
      },
    })),
    __mockEmailSend: mockEmailSend,
  }
})

// Typed mocks
const mockCreateApiHandler = createApiHandler as jest.MockedFunction<
  typeof createApiHandler
>
const mockDb = db as jest.Mocked<typeof db>
const mockUserIsMember = userIsMember as jest.MockedFunction<
  typeof userIsMember
>
const mockHandleRegisterUser = handleRegisterUser as jest.MockedFunction<
  typeof handleRegisterUser
>
const mockGetActiveUserAccount = getActiveUserAccount as jest.MockedFunction<
  typeof getActiveUserAccount
>
const mockIsExpired = isExpired as jest.MockedFunction<typeof isExpired>

// Mock data
const mockUserAccount = {
  id: 'account-1',
  email: 'user@example.com',
  given_name: 'John',
  family_name: 'Doe',
  picture: null,
}

const mockUserProfile = {
  id: 'user-1',
  accountId: 'account-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'user@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
  avatar: null,
  phone: null,
}

const mockInvitation = {
  id: 'invite-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-1',
  updatedBy: 'user-1',
  organizationId: 'org-1',
  invitedByUserId: 'inviter-1',
  token: 'valid-token',
  expires: new Date('2024-12-31T23:59:59.999Z'),
  inviteeFirstName: 'John',
  inviteeLastName: 'Doe',
  inviteeEmail: 'user@example.com',
  roles: [MemberRole.appraiser],
  status: OrgInvitationStatus.pending,
  invitedBy: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
  },
  organization: {
    id: 'org-1',
    name: 'Test Organization',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
  },
}

describe('organization-join-handlers', () => {
  let mockEmailSend: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    // Get the mock from the resend module
    const resendMock = require('resend') as any
    mockEmailSend = resendMock.__mockEmailSend

    // Setup default successful mocks
    mockGetActiveUserAccount.mockResolvedValue(mockUserAccount)
    ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(mockUserProfile)
    ;(mockDb.orgInvitation.findUnique as jest.Mock).mockResolvedValue(
      mockInvitation as any,
    )
    mockIsExpired.mockReturnValue(false)
    mockUserIsMember.mockResolvedValue(false)

    // Mock database operations
    ;(mockDb.orgInvitation.update as jest.Mock).mockResolvedValue({
      id: 'invite-1',
    })

    // Mock successful email send
    mockEmailSend.mockResolvedValue({
      data: { id: 'mock-email-id' },
      error: null,
    })

    // Mock createApiHandler to call the handler function directly
    mockCreateApiHandler.mockImplementation((handlerFn: any, _config?: any) => {
      return handlerFn({ user: mockUserAccount }) // Provide proper user object
    })
  })

  describe('handleJoinOrganization', () => {
    const validPayload: OrgJoinPayload = {
      token: 'valid-token',
      status: 'accepted',
    }

    it('should join organization successfully', async () => {
      const result = await handleJoinOrganization('org-1', validPayload)

      expect(result).toEqual({
        status: 'accepted',
        message: 'Successfully joined organization.',
      })
      expect(mockDb.orgInvitation.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-token', organizationId: 'org-1' },
        select: {
          id: true,
          expires: true,
          status: true,
          organization: { select: { name: true, avatar: true } },
          invitedBy: {
            select: { firstName: true, lastName: true, email: true },
          },
          inviteeFirstName: true,
          inviteeLastName: true,
          inviteeEmail: true,
          roles: true,
        },
      })
    })

    it('should send notification email to inviter when user joins organization', async () => {
      await handleJoinOrganization('org-1', validPayload)

      expect(mockEmailSend).toHaveBeenCalledWith(
        {
          from: 'PrizmaTrack <noreply@notifications.prizmatrack.com>',
          to: mockInvitation.invitedBy.email,
          subject: expect.any(String),
          react: expect.anything(), // JSX component
        },
        { idempotencyKey: `org-join-owner-notification/${mockInvitation.id}` },
      )
    })

    it('should handle email sending failure gracefully without blocking org join', async () => {
      // Mock email send failure
      mockEmailSend.mockResolvedValue({
        data: null,
        error: { message: 'Failed to send email', name: 'EmailError' },
      })

      const result = await handleJoinOrganization('org-1', validPayload)

      // Organization join should still succeed despite email failure
      expect(result).toEqual({
        status: 'accepted',
        message: 'Successfully joined organization.',
      })

      // Email should have been attempted
      expect(mockEmailSend).toHaveBeenCalled()
    })

    it('should skip email notification when inviter has no email', async () => {
      // Mock invitation without inviter email
      const invitationWithoutEmail = {
        ...mockInvitation,
        invitedBy: {
          ...mockInvitation.invitedBy,
          email: null,
        },
      }
      ;(mockDb.orgInvitation.findUnique as jest.Mock).mockResolvedValue(
        invitationWithoutEmail,
      )

      const result = await handleJoinOrganization('org-1', validPayload)

      expect(result).toEqual({
        status: 'accepted',
        message: 'Successfully joined organization.',
      })

      // Email should not have been sent
      expect(mockEmailSend).not.toHaveBeenCalled()
    })

    it('should automatically register user profile when user has no profile', async () => {
      // Mock user with no profile initially
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

      // Mock successful profile registration
      mockHandleRegisterUser.mockResolvedValue({
        status: 200,
        data: mockUserProfile,
        message: 'User profile created successfully.',
      })

      const result = await handleJoinOrganization('org-1', validPayload)

      expect(result).toEqual({
        status: 'accepted',
        message: 'Successfully joined organization.',
      })

      // Verify profile registration was called
      expect(mockHandleRegisterUser).toHaveBeenCalledTimes(1)

      // Verify user lookup was called to check for existing profile
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { accountId: mockUserAccount.id },
        select: { id: true },
      })
    })

    it('should handle profile registration failure gracefully', async () => {
      // Mock user with no profile initially
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

      // Mock failed profile registration (throws error)
      mockHandleRegisterUser.mockRejectedValue(
        new Error('Profile registration failed'),
      )

      // Should throw AuthenticationError since no user profile after failed registration
      await expect(
        handleJoinOrganization('org-1', validPayload),
      ).rejects.toThrow(AuthenticationError)

      // Verify profile registration was attempted
      expect(mockHandleRegisterUser).toHaveBeenCalledTimes(1)
    })

    it('should handle profile registration returning error response', async () => {
      // Mock user with no profile initially
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

      // Mock failed profile registration (returns error response)
      mockHandleRegisterUser.mockResolvedValue({
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Failed to create profile',
        },
      })

      // Should throw AuthenticationError since no user profile after failed registration
      await expect(
        handleJoinOrganization('org-1', validPayload),
      ).rejects.toThrow(AuthenticationError)

      // Verify profile registration was attempted
      expect(mockHandleRegisterUser).toHaveBeenCalledTimes(1)
    })

    it('should skip profile registration when user already has profile', async () => {
      // Mock user with existing profile
      ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(mockUserProfile)

      const result = await handleJoinOrganization('org-1', validPayload)

      expect(result).toEqual({
        status: 'accepted',
        message: 'Successfully joined organization.',
      })

      // Verify profile registration was NOT called since profile already exists
      expect(mockHandleRegisterUser).not.toHaveBeenCalled()
    })

    it('should throw ValidationError when token is missing', async () => {
      const payloadWithoutToken = { token: '' }

      await expect(
        handleJoinOrganization('org-1', payloadWithoutToken),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when organizationId is missing', async () => {
      await expect(handleJoinOrganization('', validPayload)).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw NotFoundError when invitation is not found', async () => {
      ;(mockDb.orgInvitation.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        handleJoinOrganization('org-1', validPayload),
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError when invitation is expired', async () => {
      mockIsExpired.mockReturnValue(true)

      await expect(
        handleJoinOrganization('org-1', validPayload),
      ).rejects.toThrow(NotFoundError)

      expect(mockDb.orgInvitation.update).toHaveBeenCalledWith({
        where: { token: 'valid-token', organizationId: 'org-1' },
        data: { token: null, status: 'expired' },
        select: { id: true },
      })
    })

    it('should throw AuthenticationError when user is not authenticated', async () => {
      // Override the createApiHandler mock for this test to provide no user
      mockCreateApiHandler.mockImplementation(
        (handlerFn: any, _config?: any) => {
          return handlerFn({ user: null })
        },
      )

      await expect(
        handleJoinOrganization('org-1', validPayload),
      ).rejects.toThrow(AuthenticationError)
    })

    it('should throw DatabaseConstraintError when user is already a member', async () => {
      mockUserIsMember.mockResolvedValue(true)

      await expect(
        handleJoinOrganization('org-1', validPayload),
      ).rejects.toThrow(DatabaseConstraintError)

      expect(mockDb.orgInvitation.update).toHaveBeenCalledWith({
        where: { token: 'valid-token', organizationId: 'org-1' },
        data: withUserFields(
          { token: null, status: 'accepted' },
          mockUserProfile.id,
        ),
        select: { id: true },
      })
    })

    it('should call createApiHandler with correct configuration', async () => {
      await handleJoinOrganization('org-1', validPayload)

      expect(mockCreateApiHandler).toHaveBeenCalledWith(expect.any(Function), {
        messages: {
          success: 'Invitation processed successfully.',
        },
        isMutation: true,
        dangerouslyBypassAuthentication: true,
      })
    })
  })
})
