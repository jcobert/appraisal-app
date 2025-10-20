import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import tailwindConfig from 'tailwind.config'

import { OrgInvitation, Organization, User } from '@repo/database'
import { fullName } from '@repo/utils'

import { getAssetPath } from '@/utils/email'
import { cn } from '@/utils/style'

import { copyright, siteConfig } from '@/configuration/site'

type Props = {
  invitee: Partial<User>
  inviter: Partial<User>
  organization: Partial<Organization> | null
  status: OrgInvitation['status']
}

export const orgInviteOwnerNotification = ({
  status,
  invitee,
  organization,
  format = 'full',
}: Props & { format?: 'short' | 'full' }) => {
  const user =
    fullName(invitee?.firstName, invitee?.lastName) || invitee?.email || ''
  if (status === 'accepted') {
    if (format === 'short') return `${user} has accepted your invitation`
    return `${user} has accepted your invitation to join ${organization?.name || 'your organization'}.`
  }
  if (status === 'declined') {
    if (format === 'short') return `${user} has declined your invitation`
    return `${user} has declined your invitation to join ${organization?.name || 'your organization'}.`
  }
  if (status === 'expired') {
    if (format === 'short') return `Your invitation to ${user} has expired`
    return `Your invitation to ${user} to join ${organization?.name || 'your organization'} has expired.`
  }
  return ''
}

const OrgInviteNotifyOwnerEmail = (props: Props) => {
  const { inviter } = props

  const inviterName = inviter?.firstName

  const msg = orgInviteOwnerNotification(props)

  return (
    <Html>
      <Tailwind config={tailwindConfig}>
        <Head>
          {/* <title></title> */}
          <Font fontFamily='Helvetica' fallbackFontFamily='sans-serif' />
        </Head>
        <Preview>{msg}</Preview>
        <Body className={cn('bg-background')}>
          <Container
            className='bg-white'
            style={{ border: '1px solid rgb(0,0,0,0.05)' }}
          >
            <Img
              className='mx-auto my-4 w-10'
              // src='http://localhost:3000/images/prizmatrack-logo-64.webp'
              src={getAssetPath('/images/prizmatrack-logo-64.webp')}
              alt={`${siteConfig.company} logo`}
            />

            <Section className='w-prose mx-auto pt-2 px-8 pb-4'>
              <Text className='text-pretty text-lg'>
                {inviterName ? `Hi ${inviterName},` : 'Hello,'}
              </Text>

              <Text className='text-pretty text-lg'>{msg}</Text>

              <Text className='text-pretty text-lg'>
                This is only a notification. No action is needed.
              </Text>
            </Section>

            <Section>
              <Hr className='mb-0 !border-t-2' />
              <div className='py-8 bg-gray-50'>
                <Text className='text-sm text-gray-900 text-center'>
                  {copyright()}
                </Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default OrgInviteNotifyOwnerEmail

OrgInviteNotifyOwnerEmail.PreviewProps = {
  invitee: { firstName: 'John', lastName: 'Smith' },
  inviter: { firstName: 'Tony', lastName: 'Jones' },
  organization: { name: 'Anchorage Appraisal' },
  status: 'accepted',
} satisfies Partial<Props>
