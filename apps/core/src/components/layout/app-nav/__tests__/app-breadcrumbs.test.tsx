import AppBreadcrumbs from '../app-breadcrumbs'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

import { CrumbMeta } from '@/utils/breadcrumbs'

import { BreadcrumbContext } from '@/providers/breadcrumbs/breadcrumb-context'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

// Mock usehooks-ts
jest.mock('usehooks-ts', () => ({
  useIsClient: () => true,
}))

const renderWithBreadcrumbContext = (
  ui: React.ReactElement,
  { crumbs = [] as CrumbMeta[], hidden = false } = {},
) => {
  const result = render(
    <BreadcrumbContext.Provider
      value={{
        crumbs,
        setCrumbs: () => {},
        hidden,
        setHidden: () => {},
      }}
    >
      {ui}
    </BreadcrumbContext.Provider>,
  )

  return {
    ...result,
    rerender: (ui: React.ReactElement) =>
      renderWithBreadcrumbContext(ui, { crumbs, hidden }),
  }
}

describe.skip('AppBreadcrumbs', () => {
  const basicSegments = ['dashboard', 'settings']

  it('renders breadcrumbs from segments when no crumbs in context', () => {
    const { getByText, getByRole, queryByRole } = renderWithBreadcrumbContext(
      <AppBreadcrumbs segments={basicSegments} />,
    )

    expect(getByText('dashboard')).toBeInTheDocument()
    expect(getByText('settings')).toBeInTheDocument()

    // First segment should be a link, last segment should not
    const dashboardLink = getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    expect(queryByRole('link', { name: /settings/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('renders breadcrumbs from context when available', () => {
    const contextCrumbs = [
      { segment: 'org', path: '/org', name: 'Organization', hidden: false },
      { segment: '123', path: '/org/123', name: 'Acme Corp', hidden: false },
    ]

    const { getByText, queryByText } = renderWithBreadcrumbContext(
      <AppBreadcrumbs segments={basicSegments} />,
      { crumbs: contextCrumbs },
    )

    expect(getByText('Organization')).toBeInTheDocument()
    expect(getByText('Acme Corp')).toBeInTheDocument()
    expect(queryByText('dashboard')).not.toBeInTheDocument()
  })

  it('hides component when hideAll is true in context', () => {
    const { queryByText } = renderWithBreadcrumbContext(
      <AppBreadcrumbs segments={basicSegments} />,
      { hidden: true },
    )

    expect(queryByText('dashboard')).not.toBeInTheDocument()
    expect(queryByText('settings')).not.toBeInTheDocument()
  })

  it('renders nothing when segments array is empty', () => {
    const { queryByRole } = renderWithBreadcrumbContext(
      <AppBreadcrumbs segments={[]} />,
    )

    expect(
      queryByRole('navigation', { name: 'breadcrumb' }),
    ).not.toBeInTheDocument()
  })

  it('filters out hidden crumbs', () => {
    const contextCrumbs = [
      { segment: 'org', path: '/org', name: 'Organization', hidden: false },
      { segment: '123', path: '/org/123', name: 'Acme Corp', hidden: true },
      {
        segment: 'members',
        path: '/org/123/members',
        name: 'Members',
        hidden: false,
      },
    ]

    const { getByText, queryByText } = renderWithBreadcrumbContext(
      <AppBreadcrumbs segments={basicSegments} />,
      { crumbs: contextCrumbs },
    )

    expect(getByText('Organization')).toBeInTheDocument()
    expect(queryByText('Acme Corp')).not.toBeInTheDocument()
    expect(getByText('Members')).toBeInTheDocument()
  })

  it('decodes URI encoded names', () => {
    const segments = ['users', 'John%20Doe']
    const { getByText } = renderWithBreadcrumbContext(
      <AppBreadcrumbs segments={segments} />,
    )

    expect(getByText('John Doe')).toBeInTheDocument()
  })

  it('hides breadcrumbs when only one segment is present', () => {
    const singleSegment = ['dashboard']
    const { queryByRole } = renderWithBreadcrumbContext(
      <AppBreadcrumbs segments={singleSegment} />,
    )

    expect(
      queryByRole('navigation', { name: 'breadcrumb' }),
    ).not.toBeInTheDocument()
  })
})
