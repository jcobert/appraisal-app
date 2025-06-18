import { Organization, User } from '@prisma/client'
import {
  Body,
  Container,
  Font,
  Head,
  Heading,
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
        <Body>
          <Container>
            <Heading className='text-xl font-normal text-balance'>{`Hey, ${inviteeName ? `${inviteeName},` : ''}`}</Heading>
            <Section>
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
            </Section>

            <Section className='my-12 flex flex-col items-center'>
              <Link
                href={inviteLink}
                className='flex min-h-[2.125rem] w-fit min-w-[6rem] cursor-pointer items-center justify-center gap-2 rounded border border-brand bg-brand px-4 py-1 text-almost-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:border-brand/25 disabled:bg-brand/70 dark:border-brand dark:disabled:border-brand-extra-dark dark:disabled:bg-brand-extra-dark/50 dark:disabled:text-brand/50 [&:not(:disabled)]:shadow [&:not(:disabled)]:hover:shadow-sm'
              >
                View invitation
              </Link>
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
