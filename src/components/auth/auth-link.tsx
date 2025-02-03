import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from '@kinde-oss/kinde-auth-nextjs/components'
import { FC, ReactNode } from 'react'

import { cn } from '@/utils/style'

type Props = {
  className?: string
  loggedIn?: boolean
  type?: 'login' | 'logout' | 'register' | 'dynamic'
  children?: ReactNode
}

const postLoginRedirectURL = '/user/welcome'

const AuthLink: FC<Props> = ({
  className,
  loggedIn = false,
  type = 'dynamic',
  children,
}) => {
  const styles = 'w-full sm:w-fit px-3 py-2'

  const Login = (
    <LoginLink
      className={cn([styles, 'btn-text', className])}
      postLoginRedirectURL={postLoginRedirectURL}
    >
      {children ?? 'Sign in'}
    </LoginLink>
  )

  const Logout = (
    <LogoutLink className={cn([styles, 'btn-text', className])}>
      {children ?? 'Sign out'}
    </LogoutLink>
  )

  const Register = (
    <RegisterLink
      className={cn([styles, 'btn', className])}
      postLoginRedirectURL={postLoginRedirectURL}
    >
      {children ?? 'Sign up'}
    </RegisterLink>
  )

  if (type === 'register') return !loggedIn ? Register : null
  if (type === 'login') return !loggedIn ? Login : null
  if (type === 'logout') return loggedIn ? Logout : null

  return loggedIn ? Logout : Login
}

export default AuthLink
