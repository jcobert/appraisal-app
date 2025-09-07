/**
 * @jest-environment node
 */

// Mock dependencies first - DO NOT REORDER THESE IMPORTS DUE TO HOISTING ISSUES
jest.mock('../../api-handlers')
jest.mock('../../client', () => ({
  db: {
    orgInvitation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))
jest.mock('../../queries/organization')
jest.mock('../../queries/user')
jest.mock('@/utils/auth')
jest.mock('@/utils/date')
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

import { createApiHandler } from '../../api-handlers'
import { db } from '../../client'
import {
  AuthenticationError,
  DatabaseConstraintError,
  NotFoundError,
  ValidationError,
} from '../../errors'
import { userIsMember } from '../../queries/organization'
import { getActiveUserProfile } from '../../queries/user'
import {
  OrgJoinPayload,
  handleJoinOrganization,
} from '../organization-join-handlers'
import { MemberRole, OrgInvitationStatus } from '@prisma/client'

import { getActiveUserAccount } from '@/utils/auth'
import { isExpired } from '@/utils/date'

// Typed mocks
const mockCreateApiHandler = createApiHandler as jest.MockedFunction<
  typeof createApiHandler
>
const mockDb = db as jest.Mocked<typeof db>
const mockUserIsMember = userIsMember as jest.MockedFunction<
  typeof userIsMember
>
const mockGetActiveUserProfile = getActiveUserProfile as jest.MockedFunction<
  typeof getActiveUserProfile
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
    mockGetActiveUserProfile.mockResolvedValue(mockUserProfile)
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
      return handlerFn({ user: null }) // dangerouslyBypassAuthentication: true, so user can be null
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
      })
    })

    it('should throw AuthenticationError when user is not authenticated', async () => {
      mockGetActiveUserAccount.mockResolvedValue(null)

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
        data: { token: null, status: 'accepted' },
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
