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
    /*
     * Match all request paths except for:
     * - API routes
     * - Internal static files/assets
     * - SEO & verification files
     * - Security & platform files
     */
    '/((?!api|_next/static|_next/image|images/|favicon.ico|robots.txt|sitemap.xml|ads.txt|app-ads.txt|manifest.json|site.webmanifest).*)',
  ],
}
