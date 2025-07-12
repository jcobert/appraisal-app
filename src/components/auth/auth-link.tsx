import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from '@kinde-oss/kinde-auth-nextjs/components'
import { ComponentPropsWithoutRef, FC, ReactNode } from 'react'

import { cn } from '@/utils/style'

import { Button } from '@/components/ui/button'

type Props = {
  className?: string
  loggedIn?: boolean
  type?: 'login' | 'logout' | 'register' | 'dynamic'
  children?: ReactNode
} & Pick<ComponentPropsWithoutRef<typeof LoginLink>, 'postLoginRedirectURL'> &
  Pick<ComponentPropsWithoutRef<typeof LogoutLink>, 'postLogoutRedirectURL'>

const Register: FC<
  Pick<Props, 'className' | 'children' | 'postLoginRedirectURL'>
> = ({ children, ...props }) => {
  return (
    <Button asChild>
      <RegisterLink {...props}>{children ?? 'Sign up'}</RegisterLink>
    </Button>
  )
}

const Login: FC<
  Pick<Props, 'className' | 'children' | 'postLoginRedirectURL'>
> = ({ children, ...props }) => {
  return (
    <Button asChild variant='ghost'>
      <LoginLink {...props}>{children ?? 'Sign in'}</LoginLink>
    </Button>
  )
}

const Logout: FC<
  Pick<Props, 'className' | 'children' | 'postLogoutRedirectURL'>
> = ({ children, ...props }) => {
  return (
    <Button asChild variant='ghost'>
      <LogoutLink {...props}>{children ?? 'Sign out'}</LogoutLink>
    </Button>
  )
}

const AuthLink: FC<Props> = ({
  className,
  loggedIn = false,
  type = 'dynamic',
  postLoginRedirectURL = '/user/welcome',
  postLogoutRedirectURL,
  ...props
}) => {
  const styles = cn('max-sm:w-full max-sm:py-6', className)

  if (type === 'register')
    return !loggedIn ? (
      <Register
        postLoginRedirectURL={postLoginRedirectURL}
        className={styles}
        {...props}
      />
    ) : null

  if (type === 'login')
    return !loggedIn ? (
      <Login
        postLoginRedirectURL={postLoginRedirectURL}
        className={styles}
        {...props}
      />
    ) : null

  if (type === 'logout')
    return loggedIn ? (
      <Logout
        postLogoutRedirectURL={postLogoutRedirectURL}
        className={styles}
        {...props}
      />
    ) : null

  return loggedIn ? (
    <Logout
      postLogoutRedirectURL={postLogoutRedirectURL}
      className={styles}
      {...props}
    />
  ) : (
    <Login
      postLoginRedirectURL={postLoginRedirectURL}
      className={styles}
      {...props}
    />
  )
}

export default AuthLink
