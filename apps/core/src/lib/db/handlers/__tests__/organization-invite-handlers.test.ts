/**
 * @jest-environment node
 */
import { createApiHandler, withUserFields } from '../../api-handlers'
import { db } from '../../client'
import { ValidationError } from '../../errors'
import { userIsOwner } from '../../queries/organization'
import {
  handleCreateOrgInvite,
  handleDeleteOrgInvite,
  handleGetPublicOrgInvite,
  handleUpdateOrgInvite,
} from '../organization-invite-handlers'

import { MemberRole, OrgInvitationStatus, User } from '@repo/database'

import { generateUniqueToken } from '@/lib/server-utils'

import { isAuthenticated } from '@/utils/auth'

import { OrgInvitePayload } from '@/features/organization/hooks/use-organization-invite'
import { getOrgInviteUrl } from '@/features/organization/utils'

// Mock @repo/utils before importing
jest.mock('@repo/utils', () => {
  const actual = jest.requireActual('@repo/utils')
  return {
    ...actual,
    generateExpiry: jest.fn(),
  }
})

const { generateExpiry } = require('@repo/utils')

jest.mock('../../api-handlers')
jest.mock('../../client', () => ({
  db: {
    organization: {
      findUnique: jest.fn(),
    },
    orgInvitation: {
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
})) // Mock the database client
jest.mock('../../queries/organization')
jest.mock('@/lib/server-utils')
jest.mock('@/utils/auth')
jest.mock('@/features/organization/utils', () => ({
  getOrgInviteUrl: jest.fn(),
}))

// Mock React email component
jest.mock('@/components/email/org-invite-email', () => {
  return jest.fn(() => '<div>Mocked Email</div>')
})

// Mock Resend properly with a factory function
jest.mock('resend', () => {
  // Create the mock inside the factory to avoid hoisting issues
  const mockEmailSend = jest.fn()

  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockEmailSend,
      },
    })),
    // Export the mock so we can access it
    __mockEmailSend: mockEmailSend,
  }
})

// Typed mocks
const mockCreateApiHandler = createApiHandler as jest.MockedFunction<
  typeof createApiHandler
>
const mockDb = db as jest.Mocked<typeof db>
const mockUserIsOwner = userIsOwner as jest.MockedFunction<typeof userIsOwner>
const mockGenerateUniqueToken = generateUniqueToken as jest.MockedFunction<
  typeof generateUniqueToken
>
const mockGenerateExpiry = generateExpiry as jest.MockedFunction<
  typeof generateExpiry
>
const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>
const mockGetOrgInviteUrl = getOrgInviteUrl as jest.MockedFunction<
  typeof getOrgInviteUrl
>

// Mock data
const mockKindeUser = {
  id: 'user-1',
  given_name: 'John',
  family_name: 'Doe',
  email: 'john@example.com',
  picture: null,
}

const mockActiveUser: User = {
  id: 'active-user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
  avatar: null,
  accountId: 'account-1',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  phone: null,
}

const mockOrganization = {
  id: 'org-1',
  name: 'Test Organization',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
  avatar: null,
  members: [],
  invitations: [],
}

const mockPayload = {
  email: 'invite@example.com',
  firstName: 'Test',
  lastName: 'User',
  roles: [MemberRole.appraiser],
} as const satisfies OrgInvitePayload

const mockInvitation = {
  id: 'invite-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-1',
  updatedBy: 'user-1',
  roles: [MemberRole.appraiser],
  organizationId: 'org-1',
  status: OrgInvitationStatus.pending,
  inviteeEmail: 'invite@example.com',
  inviteeFirstName: 'Test',
  inviteeLastName: 'User',
  expires: new Date('2024-12-31'),
  token: 'mock-token',
  invitedByUserId: 'active-user-1',
  organization: mockOrganization,
  invitedBy: mockActiveUser,
}

describe('organization-invite-handlers', () => {
  let mockEmailSend: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    // Get the mock from the resend module
    const resendMock = require('resend') as any
    mockEmailSend = resendMock.__mockEmailSend

    // Setup default successful mocks
    mockIsAuthenticated.mockResolvedValue({
      allowed: true,
      user: mockKindeUser,
    })
    ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(mockActiveUser)
    ;(mockDb.organization.findUnique as jest.Mock).mockResolvedValue(
      mockOrganization,
    )
    mockGenerateUniqueToken.mockReturnValue('mock-token')
    mockGenerateExpiry.mockReturnValue('2024-12-31T23:59:59.999Z')
    mockGetOrgInviteUrl.mockReturnValue({
      local: '/organization-invite/org-1/join?inv=mock-token',
      absolute:
        'https://app.prizmatrack.com/organization-invite/org-1/join?inv=mock-token',
    })

    // Mock database operations
    ;(mockDb.orgInvitation.create as jest.Mock).mockResolvedValue({
      id: 'invite-1',
    })
    ;(mockDb.orgInvitation.delete as jest.Mock).mockResolvedValue({
      id: 'invite-1',
      inviteeFirstName: 'Test',
      inviteeLastName: 'User',
    })
    ;(mockDb.orgInvitation.update as jest.Mock).mockResolvedValue({
      id: 'invite-1',
    })

    // Mock successful email send
    mockEmailSend.mockResolvedValue({
      data: { id: 'mock-email-id' },
      error: null,
    })

    // Mock createApiHandler to call the handler function directly with both user and userProfileId
    mockCreateApiHandler.mockImplementation((handlerFn: any, _config?: any) => {
      return handlerFn({
        user: mockKindeUser,
        userProfileId: mockActiveUser.id,
      })
    })
  })

  describe('handleGetPublicOrgInvite', () => {
    const validParams = {
      organizationId: 'org-1',
      token: 'mock-token',
      status: OrgInvitationStatus.pending as OrgInvitationStatus,
    }

    beforeEach(() => {
      // Mock findUnique to return invitation with organization and invitedBy data
      ;(mockDb.orgInvitation.findUnique as jest.Mock).mockResolvedValue({
        organization: {
          name: mockOrganization.name,
          avatar: mockOrganization.avatar,
        },
        invitedBy: mockActiveUser,
      })

      // Mock createApiHandler to call the handler function directly
      // This handler uses dangerouslyBypassAuthentication, so no user is passed
      mockCreateApiHandler.mockImplementation(
        (handlerFn: any, _config?: any) => {
          return handlerFn({})
        },
      )
    })

    it('should retrieve organization invite successfully with all parameters', async () => {
      const result = await handleGetPublicOrgInvite(validParams)

      expect(result).toEqual({
        organization: {
          name: mockOrganization.name,
          avatar: mockOrganization.avatar,
        },
        invitedBy: mockActiveUser,
      })
      expect(mockDb.orgInvitation.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId: validParams.organizationId,
          token: validParams.token,
          status: validParams.status,
        },
        select: {
          organization: { select: { name: true, avatar: true } },
          invitedBy: { select: { firstName: true, lastName: true } },
        },
      })
    })

    it('should retrieve organization invite without status parameter', async () => {
      const paramsWithoutStatus = {
        organizationId: 'org-1',
        token: 'mock-token',
      }

      await handleGetPublicOrgInvite(paramsWithoutStatus)

      expect(mockDb.orgInvitation.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId: paramsWithoutStatus.organizationId,
          token: paramsWithoutStatus.token,
          status: undefined,
        },
        select: {
          organization: { select: { name: true, avatar: true } },
          invitedBy: { select: { firstName: true, lastName: true } },
        },
      })
    })

    it('should return null when invitation is not found', async () => {
      ;(mockDb.orgInvitation.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await handleGetPublicOrgInvite(validParams)

      expect(result).toBeNull()
    })

    it('should throw ValidationError when organizationId is missing', async () => {
      const invalidParams = {
        organizationId: '',
        token: 'mock-token',
        status: OrgInvitationStatus.pending as OrgInvitationStatus,
      }

      await expect(handleGetPublicOrgInvite(invalidParams)).rejects.toThrow(
        ValidationError,
      )
      await expect(handleGetPublicOrgInvite(invalidParams)).rejects.toThrow(
        'Invalid data provided.',
      )
    })

    it('should throw ValidationError when token is missing', async () => {
      const invalidParams = {
        organizationId: 'org-1',
        token: '',
        status: OrgInvitationStatus.pending as OrgInvitationStatus,
      }

      await expect(handleGetPublicOrgInvite(invalidParams)).rejects.toThrow(
        ValidationError,
      )
      await expect(handleGetPublicOrgInvite(invalidParams)).rejects.toThrow(
        'Invalid data provided.',
      )
    })

    it('should throw ValidationError when both organizationId and token are missing', async () => {
      const invalidParams = {
        organizationId: '',
        token: '',
      }

      await expect(handleGetPublicOrgInvite(invalidParams)).rejects.toThrow(
        ValidationError,
      )
    })

    it('should call createApiHandler with dangerouslyBypassAuthentication', async () => {
      await handleGetPublicOrgInvite(validParams)

      expect(mockCreateApiHandler).toHaveBeenCalledWith(expect.any(Function), {
        dangerouslyBypassAuthentication: true,
      })
    })

    it('should not require authentication', async () => {
      // Ensure isAuthenticated is not called
      const isAuthenticatedCallCount = mockIsAuthenticated.mock.calls.length

      await handleGetPublicOrgInvite(validParams)

      // Should not have made additional authentication calls
      expect(mockIsAuthenticated.mock.calls.length).toBe(
        isAuthenticatedCallCount,
      )
    })

    it('should handle different invitation statuses', async () => {
      const statuses = [
        OrgInvitationStatus.pending,
        OrgInvitationStatus.accepted,
        OrgInvitationStatus.expired,
      ]

      for (const status of statuses) {
        jest.clearAllMocks()
        ;(mockDb.orgInvitation.findUnique as jest.Mock).mockResolvedValue({
          organization: {
            name: mockOrganization.name,
            avatar: mockOrganization.avatar,
          },
          invitedBy: mockActiveUser,
        })

        await handleGetPublicOrgInvite({
          organizationId: 'org-1',
          token: 'mock-token',
          status,
        })

        expect(mockDb.orgInvitation.findUnique).toHaveBeenCalledWith({
          where: {
            organizationId: 'org-1',
            token: 'mock-token',
            status,
          },
          select: {
            organization: { select: { name: true, avatar: true } },
            invitedBy: { select: { firstName: true, lastName: true } },
          },
        })
      }
    })

    it('should only select organization name, avatar, and invitedBy name fields', async () => {
      await handleGetPublicOrgInvite(validParams)

      expect(mockDb.orgInvitation.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            organization: { select: { name: true, avatar: true } },
            invitedBy: { select: { firstName: true, lastName: true } },
          },
        }),
      )
    })

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed')
      ;(mockDb.orgInvitation.findUnique as jest.Mock).mockRejectedValue(dbError)

      await expect(handleGetPublicOrgInvite(validParams)).rejects.toThrow(
        'Database connection failed',
      )
    })

    it('should sanitize token format and allow database lookup', async () => {
      // Schema uses sanitizedField.text({ type: 'uuid' }) which strips invalid characters
      // but still requires at least some valid characters to remain (nonempty).
      const tokenTests = [
        { token: 'valid-token-123', description: 'valid with hyphens' },
        {
          token: 'token_with_underscore',
          description: 'valid with underscores',
        },
        { token: 'a1b2c3d4e5f6', description: 'valid hex format' },
        {
          token: 'token-with-special-chars!@#',
          description: 'sanitizes special chars to: token-with-special-chars',
        },
        {
          token: 'abc<script>alert("xss")</script>def',
          description: 'sanitizes XSS to: abcscriptalertxssscriptdef',
        },
      ]

      for (const { token } of tokenTests) {
        jest.clearAllMocks()
        ;(mockDb.orgInvitation.findUnique as jest.Mock).mockResolvedValue({
          organization: {
            name: mockOrganization.name,
            avatar: mockOrganization.avatar,
          },
          invitedBy: mockActiveUser,
        })

        // All tokens should succeed after sanitization (have valid chars remaining)
        await handleGetPublicOrgInvite({
          organizationId: 'org-1',
          token,
          status: OrgInvitationStatus.pending,
        })

        expect(mockDb.orgInvitation.findUnique).toHaveBeenCalled()
      }

      // Tokens that become empty after sanitization should fail
      const invalidTokens = ['!@#$%', '', '<>']
      for (const token of invalidTokens) {
        await expect(
          handleGetPublicOrgInvite({
            organizationId: 'org-1',
            token,
            status: OrgInvitationStatus.pending,
          }),
        ).rejects.toThrow(ValidationError)
      }
    })
  })

  describe('handleCreateOrgInvite', () => {
    it('should create organization invite successfully', async () => {
      // Mock the email send to return success
      mockEmailSend.mockResolvedValue({
        data: { id: 'mock-email-id' },
        error: null,
      })

      const result = await handleCreateOrgInvite('org-1', mockPayload)

      expect(result).toEqual({ id: 'invite-1' })
      expect(mockDb.orgInvitation.create).toHaveBeenCalledWith({
        data: withUserFields(
          {
            organizationId: 'org-1',
            invitedByUserId: mockActiveUser.id,
            inviteeEmail: mockPayload.email,
            inviteeFirstName: mockPayload.firstName,
            inviteeLastName: mockPayload.lastName,
            roles: mockPayload.roles,
            expires: expect.any(String),
            token: 'mock-token',
          },
          mockActiveUser.id,
          ['createdBy', 'updatedBy'],
        ),
        select: { id: true },
      })
    })

    it('should throw ValidationError when email is missing', async () => {
      const payloadWithoutEmail = { ...mockPayload, email: '' }

      // Mock createApiHandler to throw the validation error
      mockCreateApiHandler.mockImplementation((handlerFn: any) => {
        return handlerFn({ user: mockKindeUser })
      })

      await expect(
        handleCreateOrgInvite('org-1', payloadWithoutEmail),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when organizationId is missing', async () => {
      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation((handlerFn: any) => {
        return handlerFn({ user: mockKindeUser })
      })

      await expect(handleCreateOrgInvite('', mockPayload)).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw error when invitation creation fails', async () => {
      ;(mockDb.orgInvitation.create as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      )

      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation((handlerFn: any) => {
        return handlerFn({ user: mockKindeUser })
      })

      await expect(handleCreateOrgInvite('org-1', mockPayload)).rejects.toThrow(
        'Database error',
      )
    })

    it('should throw error when email sending fails', async () => {
      mockEmailSend.mockResolvedValue({
        error: { message: 'Email service error' },
      })

      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation((handlerFn: any) => {
        return handlerFn({ user: mockKindeUser })
      })

      await expect(handleCreateOrgInvite('org-1', mockPayload)).rejects.toThrow(
        'Failure sending invitation email.',
      )
    })

    it('should call createApiHandler with correct configuration', async () => {
      await handleCreateOrgInvite('org-1', mockPayload)

      expect(mockCreateApiHandler).toHaveBeenCalledWith(expect.any(Function), {
        authorizationCheck: expect.any(Function),
        messages: {
          success: 'Invitation sent successfully.',
        },
        isMutation: true,
      })
    })

    it('should generate unique token and expiry correctly', async () => {
      await handleCreateOrgInvite('org-1', mockPayload)

      expect(mockGenerateUniqueToken).toHaveBeenCalled()
      expect(mockGenerateExpiry).toHaveBeenCalledWith(
        expect.any(Number), // ORG_INVITE_EXPIRY
      )
    })

    it('should fetch organization and active user data', async () => {
      await handleCreateOrgInvite('org-1', mockPayload)

      expect(mockDb.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        select: { name: true },
      })
      expect(mockDb.user.findUnique).toHaveBeenCalled()
    })

    it('should send email with correct parameters', async () => {
      await handleCreateOrgInvite('org-1', mockPayload)

      expect(mockEmailSend).toHaveBeenCalledWith(
        {
          from: 'PrizmaTrack <noreply@notifications.prizmatrack.com>',
          to: mockPayload.email,
          subject: "You've been invited to join an organization",
          react: expect.anything(), // JSX component
        },
        { idempotencyKey: 'org-invite/mock-token' },
      )
    })

    it('should validate payload structure', async () => {
      const invalidPayload = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [MemberRole.appraiser],
      } as OrgInvitePayload

      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation((handlerFn: any) => {
        return handlerFn({ user: mockKindeUser })
      })

      // Should not throw for valid payload
      const result = await handleCreateOrgInvite('org-1', invalidPayload)
      expect(result).toEqual({ id: 'invite-1' })
    })
  })

  describe('handleDeleteOrgInvite', () => {
    beforeEach(() => {
      // Setup successful defaults for delete tests
      mockUserIsOwner.mockResolvedValue(true)
    })

    it('should delete organization invite successfully', async () => {
      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation(
        (handlerFn: any, config?: any) => {
          // Call the authorization check if provided
          if (config?.authorizationCheck) {
            config.authorizationCheck({ user: mockKindeUser })
          }
          return handlerFn({ user: mockKindeUser })
        },
      )

      const result = await handleDeleteOrgInvite('org-1', 'invite-1')

      expect(result).toEqual({
        id: 'invite-1',
        inviteeFirstName: 'Test',
        inviteeLastName: 'User',
      })
      expect(mockDb.orgInvitation.delete).toHaveBeenCalledWith({
        where: { id: 'invite-1', organizationId: 'org-1' },
        select: { id: true, inviteeFirstName: true, inviteeLastName: true },
      })
      expect(mockUserIsOwner).toHaveBeenCalledWith({
        organizationId: 'org-1',
        accountId: mockKindeUser.id,
      })
    })

    it('should throw ValidationError when inviteId is missing', async () => {
      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation((handlerFn: any) => {
        return handlerFn({ user: mockKindeUser })
      })

      await expect(handleDeleteOrgInvite('org-1', '')).rejects.toThrow(
        ValidationError,
      )
      await expect(handleDeleteOrgInvite('org-1', '')).rejects.toThrow(
        'Invite ID is required.',
      )
    })

    it('should throw ValidationError when organizationId is missing', async () => {
      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation((handlerFn: any) => {
        return handlerFn({ user: mockKindeUser })
      })

      await expect(handleDeleteOrgInvite('', 'invite-1')).rejects.toThrow(
        ValidationError,
      )
      await expect(handleDeleteOrgInvite('', 'invite-1')).rejects.toThrow(
        'Organization ID is required.',
      )
    })

    it('should call createApiHandler with correct configuration', async () => {
      await handleDeleteOrgInvite('org-1', 'invite-1')

      expect(mockCreateApiHandler).toHaveBeenCalledWith(expect.any(Function), {
        authorizationCheck: expect.any(Function),
        messages: {
          unauthorized: 'Unauthorized to update this organization.',
          success: 'Invitation deleted successfully.',
        },
        isMutation: true,
      })
    })

    it('should check user authorization with userIsOwner', async () => {
      // Mock createApiHandler to call the authorization check
      mockCreateApiHandler.mockImplementation(
        async (handlerFn: any, config?: any) => {
          // Call the authorization check if provided
          if (config?.authorizationCheck) {
            await config.authorizationCheck({ user: mockKindeUser })
          }
          return handlerFn({ user: mockKindeUser })
        },
      )

      await handleDeleteOrgInvite('org-1', 'invite-1')
      expect(mockUserIsOwner).toHaveBeenCalledWith({
        organizationId: 'org-1',
        accountId: mockKindeUser.id,
      })
    })
  })

  describe('handleUpdateOrgInvite', () => {
    const updatePayload: OrgInvitePayload = {
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'User',
      roles: [MemberRole.manager],
    }

    beforeEach(() => {
      // Setup successful defaults for update tests
      mockUserIsOwner.mockResolvedValue(true)
      ;(mockDb.orgInvitation.findUnique as jest.Mock).mockResolvedValue(
        mockInvitation,
      )
    })

    it('should update organization invite successfully', async () => {
      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation(
        (handlerFn: any, config?: any) => {
          // Call the authorization check if provided
          if (config?.authorizationCheck) {
            config.authorizationCheck({ user: mockKindeUser })
          }
          return handlerFn({
            user: mockKindeUser,
            userProfileId: mockActiveUser.id,
          })
        },
      )

      const result = await handleUpdateOrgInvite(
        'org-1',
        'invite-1',
        updatePayload,
      )

      expect(result).toEqual({ id: 'invite-1' })
      expect(mockDb.orgInvitation.findUnique).toHaveBeenCalledWith({
        where: { id: 'invite-1', organizationId: 'org-1', status: 'pending' },
        select: { id: true },
      })
      expect(mockDb.orgInvitation.update).toHaveBeenCalledWith({
        where: { id: 'invite-1', organizationId: 'org-1' },
        data: withUserFields(
          {
            inviteeFirstName: updatePayload.firstName,
            inviteeLastName: updatePayload.lastName,
            roles: updatePayload.roles,
          },
          mockActiveUser.id, // Now uses userProfileId
        ),
        select: { id: true },
      })
      expect(mockUserIsOwner).toHaveBeenCalledWith({
        organizationId: 'org-1',
        accountId: mockKindeUser.id,
      })
    })

    it('should accept partial payload (any subset of fields)', async () => {
      // Only updating roles, not all fields
      const partialPayload: Partial<OrgInvitePayload> = {
        roles: [MemberRole.manager],
      }

      mockCreateApiHandler.mockImplementation(
        (handlerFn: any, config?: any) => {
          if (config?.authorizationCheck) {
            config.authorizationCheck({ user: mockKindeUser })
          }
          return handlerFn({
            user: mockKindeUser,
            userProfileId: mockActiveUser.id,
          })
        },
      )

      const result = await handleUpdateOrgInvite(
        'org-1',
        'invite-1',
        partialPayload as OrgInvitePayload,
      )

      expect(result).toEqual({ id: 'invite-1' })
      expect(mockDb.orgInvitation.update).toHaveBeenCalledWith({
        where: { id: 'invite-1', organizationId: 'org-1' },
        data: withUserFields(
          {
            inviteeFirstName: undefined,
            inviteeLastName: undefined,
            roles: [MemberRole.manager],
          },
          mockActiveUser.id,
        ),
        select: { id: true },
      })
    })

    it('should validate payload with partial schema (fields are optional)', async () => {
      // Empty payload should be valid with partial schema
      const emptyPayload = {}

      mockCreateApiHandler.mockImplementation(
        (handlerFn: any, config?: any) => {
          if (config?.authorizationCheck) {
            config.authorizationCheck({ user: mockKindeUser })
          }
          return handlerFn({ user: mockKindeUser })
        },
      )

      const result = await handleUpdateOrgInvite(
        'org-1',
        'invite-1',
        emptyPayload as OrgInvitePayload,
      )

      // Should succeed because partial schema makes all fields optional
      expect(result).toEqual({ id: 'invite-1' })
    })

    it('should manually set updatedBy field (not use omitSystemFields)', async () => {
      // Payload includes updatedBy which should be ignored and overridden
      const payloadWithUpdatedBy = {
        ...updatePayload,
        updatedBy: 'malicious-user-id',
      }

      mockCreateApiHandler.mockImplementation(
        (handlerFn: any, config?: any) => {
          if (config?.authorizationCheck) {
            config.authorizationCheck({ user: mockKindeUser })
          }
          return handlerFn({
            user: mockKindeUser,
            userProfileId: mockActiveUser.id,
          })
        },
      )

      await handleUpdateOrgInvite(
        'org-1',
        'invite-1',
        payloadWithUpdatedBy as OrgInvitePayload,
      )

      // Verify updatedBy is set from user context, not from payload
      expect(mockDb.orgInvitation.update).toHaveBeenCalledWith({
        where: { id: 'invite-1', organizationId: 'org-1' },
        data: withUserFields(
          {
            inviteeFirstName: updatePayload.firstName,
            inviteeLastName: updatePayload.lastName,
            roles: updatePayload.roles,
          },
          mockActiveUser.id, // Set from context (userProfileId), not payload
        ),
        select: { id: true },
      })
    })

    it('should throw ValidationError when payload is missing', async () => {
      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation((handlerFn: any) => {
        return handlerFn({ user: mockKindeUser })
      })

      await expect(
        handleUpdateOrgInvite('org-1', 'invite-1', null as any),
      ).rejects.toThrow(ValidationError)
      await expect(
        handleUpdateOrgInvite('org-1', 'invite-1', null as any),
      ).rejects.toThrow('Invalid data provided.')
    })

    it('should throw error when invitation is not found or not pending', async () => {
      ;(mockDb.orgInvitation.findUnique as jest.Mock).mockResolvedValue(null)

      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation((handlerFn: any) => {
        return handlerFn({ user: mockKindeUser })
      })

      await expect(
        handleUpdateOrgInvite('org-1', 'invite-1', updatePayload),
      ).rejects.toThrow('Invitation not found or no longer pending.')
    })

    it('should call createApiHandler with correct configuration', async () => {
      await handleUpdateOrgInvite('org-1', 'invite-1', updatePayload)

      expect(mockCreateApiHandler).toHaveBeenCalledWith(expect.any(Function), {
        authorizationCheck: expect.any(Function),
        messages: {
          unauthorized: 'Unauthorized to update this organization.',
          success: 'Invitation updated successfully.',
        },
        isMutation: true,
      })
    })

    it('should check user authorization with userIsOwner', async () => {
      // Mock createApiHandler to call the authorization check
      mockCreateApiHandler.mockImplementation(
        async (handlerFn: any, config?: any) => {
          // Call the authorization check if provided
          if (config?.authorizationCheck) {
            await config.authorizationCheck({ user: mockKindeUser })
          }
          return handlerFn({ user: mockKindeUser })
        },
      )

      await handleUpdateOrgInvite('org-1', 'invite-1', updatePayload)
      expect(mockUserIsOwner).toHaveBeenCalledWith({
        organizationId: 'org-1',
        accountId: mockKindeUser.id,
      })
    })

    it('should validate invitation exists and is pending', async () => {
      await handleUpdateOrgInvite('org-1', 'invite-1', updatePayload)

      expect(mockDb.orgInvitation.findUnique).toHaveBeenCalledWith({
        where: { id: 'invite-1', organizationId: 'org-1', status: 'pending' },
        select: { id: true },
      })
    })
  })
})
