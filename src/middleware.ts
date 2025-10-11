import { KindeAccessToken, KindeUserBase } from '@kinde-oss/kinde-auth-nextjs'
import { withAuth } from '@kinde-oss/kinde-auth-nextjs/middleware'
import { MiddlewareConfig, NextRequest, NextResponse } from 'next/server'

type WithAuthCallback = (
  req: NextRequest & {
    kindeAuth: { user: KindeUserBase; token: KindeAccessToken }
  },
) => Promise<NextResponse | void>

type WithAuthOptions = {
  publicPaths?: (string | RegExp)[]
  loginPage?: string
  isReturnToCurrentPage?: boolean
  redirectURLBase?: string | URL
  orgCode?: string
  isAuthorized?: (ctx: {
    req: NextRequest
    token: KindeAccessToken | null
  }) => boolean
}

// Runs after authentication is verified.
const middleware: WithAuthCallback = async (_req) => {}

export default withAuth(middleware, {
  publicPaths: [
    '/',
    /\/organization-invite\/[^?&]+\/join(?=\?|$)/, // org invite links
  ],
  isReturnToCurrentPage: true,
} satisfies WithAuthOptions)

export const config: MiddlewareConfig = {
  matcher: [
    '/((?!api|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
