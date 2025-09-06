/**
 * @jest-environment node
*/

// Mock dependencies first - DO NOT REORDER THESE IMPORTS DUE TO HOISTING ISSUES
jest.mock('../../api-handlers')
jest.mock('../../queries/organization')
jest.mock('../../queries/user')
jest.mock('@/lib/server-utils')
jest.mock('@/utils/date')
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

import { createApiHandler } from '../../api-handlers'
import { ValidationError } from '../../errors'
import {
  createOrgInvitation,
  getOrganization,
} from '../../queries/organization'
import { getActiveUserProfile } from '../../queries/user'
import { handleCreateOrgInvite } from '../organization-invite-handlers'
import { MemberRole, OrgInvitationStatus, User } from '@prisma/client'

import { generateUniqueToken } from '@/lib/server-utils'

import { isAuthenticated } from '@/utils/auth'
import { generateExpiry } from '@/utils/date'

import { OrgInvitePayload } from '@/features/organization/hooks/use-organization-invite'
import { getOrgInviteUrl } from '@/features/organization/utils'

// Typed mocks
const mockCreateApiHandler = createApiHandler as jest.MockedFunction<
  typeof createApiHandler
>
const mockCreateOrgInvitation = createOrgInvitation as jest.MockedFunction<
  typeof createOrgInvitation
>
const mockGetOrganization = getOrganization as jest.MockedFunction<
  typeof getOrganization
>
const mockGetActiveUserProfile = getActiveUserProfile as jest.MockedFunction<
  typeof getActiveUserProfile
>
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

const mockPayload: OrgInvitePayload = {
  email: 'invite@example.com',
  firstName: 'Test',
  lastName: 'User',
  roles: [MemberRole.appraiser],
}

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

    mockGetActiveUserProfile.mockResolvedValue(mockActiveUser)
    mockGetOrganization.mockResolvedValue(mockOrganization)
    mockGenerateUniqueToken.mockReturnValue('mock-token')
    mockGenerateExpiry.mockReturnValue('2024-12-31T23:59:59.999Z')
    mockCreateOrgInvitation.mockResolvedValue(mockInvitation)
    mockGetOrgInviteUrl.mockReturnValue({
      local: '/organization-invite/org-1/join?inv=mock-token',
      absolute: 'https://app.prizmatrack.com/organization-invite/org-1/join?inv=mock-token'
    })

    // Mock successful email send
    mockEmailSend.mockResolvedValue({ 
      data: { id: 'mock-email-id' },
      error: null 
    })

    // Mock createApiHandler to call the handler function directly
    mockCreateApiHandler.mockImplementation((handlerFn: any, _config?: any) => {
      return handlerFn({ user: mockKindeUser })
    })
  })

  describe('handleCreateOrgInvite', () => {
    it('should create organization invite successfully', async () => {
      // Mock the email send to return success
      mockEmailSend.mockResolvedValue({ 
        data: { id: 'mock-email-id' },
        error: null 
      })

      const result = await handleCreateOrgInvite('org-1', mockPayload)

      expect(result).toEqual({ success: true })
      expect(mockCreateOrgInvitation).toHaveBeenCalledWith({
        data: {
          createdBy: mockKindeUser.id,
          updatedBy: mockKindeUser.id,
          organizationId: 'org-1',
          invitedByUserId: mockActiveUser.id,
          inviteeEmail: mockPayload.email,
          inviteeFirstName: mockPayload.firstName,
          inviteeLastName: mockPayload.lastName,
          roles: mockPayload.roles,
          expires: expect.any(String),
          token: 'mock-token',
        },
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
      mockCreateOrgInvitation.mockResolvedValue(null)

      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation((handlerFn: any) => {
        return handlerFn({ user: mockKindeUser })
      })

      await expect(handleCreateOrgInvite('org-1', mockPayload)).rejects.toThrow(
        'Failed to create invitation.',
      )
    })

    it('should throw error when email sending fails', async () => {
      mockEmailSend.mockResolvedValue({ 
        error: { message: 'Email service error' } 
      })

      // Mock createApiHandler to call the handler function directly
      mockCreateApiHandler.mockImplementation((handlerFn: any) => {
        return handlerFn({ user: mockKindeUser })
      })

      await expect(handleCreateOrgInvite('org-1', mockPayload)).rejects.toThrow(
        'Failed to send invitation email: Email service error',
      )
    })

    it('should call createApiHandler with correct configuration', async () => {
      await handleCreateOrgInvite('org-1', mockPayload)

      expect(mockCreateApiHandler).toHaveBeenCalledWith(expect.any(Function), {
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

      expect(mockGetOrganization).toHaveBeenCalledWith({
        organizationId: 'org-1',
      })
      expect(mockGetActiveUserProfile).toHaveBeenCalled()
    })

    it('should send email with correct parameters', async () => {
      await handleCreateOrgInvite('org-1', mockPayload)

      expect(mockEmailSend).toHaveBeenCalledWith({
        from: 'PrizmaTrack <noreply@notifications.prizmatrack.com>',
        to: mockPayload.email,
        subject: "You've been invited to join an organization",
        react: expect.anything(), // JSX component
      })
    })

    it('should handle missing active user gracefully', async () => {
      mockGetActiveUserProfile.mockResolvedValue(null)

      await handleCreateOrgInvite('org-1', mockPayload)

      expect(mockCreateOrgInvitation).toHaveBeenCalledWith({
        data: expect.objectContaining({
          invitedByUserId: '',
        }),
      })
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
      expect(result).toEqual({ success: true })
    })
  })
})
