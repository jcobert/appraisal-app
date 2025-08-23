import { Organization, User } from '@prisma/client'
import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import tailwindConfig from 'tailwind.config'

import { getAssetPath } from '@/utils/email'
import { fullName } from '@/utils/string'
import { cn } from '@/utils/style'

import { copyright, siteConfig } from '@/configuration/site'

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
          {/* <title></title> */}
          <Font fontFamily='Helvetica' fallbackFontFamily='sans-serif' />
        </Head>
        <Preview>{`${inviterName || 'Someone'} invited you to join their organization, ${organization?.name}, on PrizmaTrack.`}</Preview>
        <Body className={cn('bg-[#ffffff]')}>
          <Container
            className='bg-white'
            style={{ border: '1px solid rgb(0,0,0,0.05)' }}
          >
            <Img
              className='mx-auto my-4 w-10'
              // src={getAbsoluteUrl('/images/prizmatrack-logo-64.webp')}
              // src={`${assetPath}/images/prizmatrack-logo-64.webp`}
              src={getAssetPath('/images/prizmatrack-logo-64.webp')}
              alt={`${siteConfig.company} logo`}
            />

            {/* <Heading className='text-xl font-normal text-balance'>{`Hi ${inviteeName ? `${inviteeName},` : ''}`}</Heading> */}

            <Section className='w-prose mx-auto pt-2 px-8'>
              <Text className='text-pretty text-lg'>
                {inviteeName ? `Hi ${inviteeName},` : 'Hello,'}
              </Text>

              <Text className='text-pretty text-lg'>
                <span
                  className={cn('mr-1', inviterName && 'font-bold')}
                >{`${inviterName || 'Someone'}`}</span>
                <span className=''>{`invited you to join their organization${organization?.name ? ', ' : ' '}`}</span>
                {organization?.name ? (
                  <span
                    className={cn('mr-1', organization?.name && 'font-bold')}
                  >{`${organization?.name},`}</span>
                ) : null}
                <span>on PrizmaTrack.</span>
              </Text>

              <Text className='text-pretty text-lg'>
                Follow the link below to view the invitation and join today.
              </Text>
            </Section>

            <Section className='mt-8 mb-12 w-fit mx-auto'>
              <Link
                href={inviteLink}
                className='w-[6rem] font-medium border border-[#0d9c8b] bg-[#0d9c8b] px-4 py-3 text-[#fafafa] text-lg'
              >
                View invitation
              </Link>
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

export default OrgInviteEmail

OrgInviteEmail.PreviewProps = {
  invitee: { firstName: 'John', lastName: 'Smith' },
  inviter: { firstName: 'Tony', lastName: 'Jones' },
  organization: { name: 'Anchorage Appraisal' },
  inviteLink: 'https://google.com',
} satisfies Props
