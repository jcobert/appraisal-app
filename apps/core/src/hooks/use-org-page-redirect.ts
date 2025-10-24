import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Organization } from '@repo/database'

import { homeUrl } from '@/utils/nav'

import { useOrganizationContext } from '@/providers/organization-provider'

type UseOrgPageRedirectOptions = {
  /** The path to redirect to when the active org changes. Defaults to '/dashboard'. */
  redirectTo?: string
  /** Whether to enable the redirect behavior. Defaults to `true`. */
  enabled?: boolean
}

/**
 * Hook that redirects users away from organization-specific pages when they
 * switch to a different organization.
 *
 * This prevents users from staying on Org A's page after switching their
 * active workspace to Org B, which would be confusing UX.
 *
 * @param currentOrgId - The organization ID that this page is about
 * @param options - Configuration options for the redirect behavior
 *
 * @example
 * ```tsx
 * // Basic usage - redirects to dashboard
 * const OrganizationPage = ({ organizationId }) => {
 *   useOrgPageRedirect(organizationId)
 *   // ... rest of component
 * }
 *
 * // Custom redirect destination
 * const OrganizationSettingsPage = ({ organizationId }) => {
 *   useOrgPageRedirect(organizationId, { redirectTo: '/organizations' })
 *   // ... rest of component
 * }
 *
 * // Conditional redirect
 * const OrganizationPage = ({ organizationId, allowCrossOrgViewing }) => {
 *   useOrgPageRedirect(organizationId, { enabled: !allowCrossOrgViewing })
 *   // ... rest of component
 * }
 * ```
 */
export const useOrgPageRedirect = (
  currentOrgId: Organization['id'],
  options: UseOrgPageRedirectOptions = {},
) => {
  const { redirectTo = homeUrl(true), enabled = true } = options
  const { activeOrgId } = useOrganizationContext()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if:
    // 1. Feature is enabled
    // 2. User has an active org selected
    // 3. The active org is different from the current page's org
    if (enabled && activeOrgId && activeOrgId !== currentOrgId) {
      router.push(redirectTo)
    }
  }, [enabled, activeOrgId, currentOrgId, router, redirectTo])
}
