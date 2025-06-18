import { Organization, User } from '@prisma/client'
import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import tailwindConfig from 'tailwind.config'

import { fullName } from '@/utils/string'
import { cn } from '@/utils/style'

type Props = {
  invitee: Partial<User>
  inviter: Partial<User>
  inviteLink: string
  organization: Partial<Organization> | null
}

const OrgInviteEmail = ({
  invitee,
  inviter,
  inviteLink,
  organization,
}: Props) => {
  const inviteeName = invitee?.firstName
  const inviterName = fullName(inviter?.firstName, inviter?.lastName)

  return (
    <Html>
      <Tailwind config={tailwindConfig}>
        <Head>
          <title></title>
          <Font fontFamily='Helvetica' fallbackFontFamily='sans-serif' />
        </Head>
        <Preview>{`${inviterName || 'Someone'} invited you to join their organization, ${organization?.name}, on PrizmaTrack.`}</Preview>
        <Body
          className={cn(
            'bg-background',
            // 'h-0 min-h-screen'
          )}
        >
          <div
            className='bg-white rounded p-2 h-fit flex flex-col gap-4'
            style={{ border: '1px solid rgb(0,0,0,0.05)' }}
          >
            {/* <Heading className='text-xl font-normal text-balance'>{`Hi ${inviteeName ? `${inviteeName},` : ''}`}</Heading> */}
            <div className='max-w-prose mx-auto'>
              <Text className='text-pretty'>
                {`Hi ${inviteeName ? `${inviteeName},` : ''}`}
              </Text>

              <Text className='text-pretty'>
                <span
                  className={cn('mr-1', inviterName && 'font-bold')}
                >{`${inviterName || 'Someone'}`}</span>
                <span className=''>{`invited you to join their organization${organization?.name ? ', ' : ' '}`}</span>
                {organization?.name ? (
                  <span
                    className={cn('mr-1', organization?.name && 'font-bold')}
                  >{`${organization?.name},`}</span>
                ) : null}
                <span className=''>on PrizmaTrack.</span>
              </Text>

              <Text className='text-pretty'>
                Follow the link below to view the invitation.
              </Text>
            </div>

            <div className='my-8 flex flex-col items-center'>
              <Link
                href={inviteLink}
                className='flex min-h-[2.125rem] sm:text-lg w-fit min-w-[6rem] cursor-pointer items-center justify-center gap-2 rounded border border-brand bg-brand px-4 py-1 text-almost-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:border-brand/25 disabled:bg-brand/70 dark:border-brand dark:disabled:border-brand-extra-dark dark:disabled:bg-brand-extra-dark/50 dark:disabled:text-brand/50 [&:not(:disabled)]:shadow [&:not(:disabled)]:hover:shadow-sm'
              >
                View invitation
              </Link>
            </div>

            <div>
              <Hr className='mb-0 !border-t-2' />
              <div className='py-8 bg-gray-50'>
                <div className='text-sm text-gray-900 text-center'>{`© ${new Date().getFullYear()} PrizmaTrack`}</div>
              </div>
            </div>
          </div>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default OrgInviteEmail

OrgInviteEmail.PreviewProps = {
  invitee: { firstName: 'John', lastName: 'Smith' },
  inviter: { firstName: 'Tony', lastName: 'Jones' },
  organization: { name: 'Anchorage Appraisal' },
  inviteLink: 'https://google.com',
} satisfies Props
