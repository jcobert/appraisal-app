import Crumbs from '../crumbs'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
// Import the mocked module to control its behavior
import { usePathname } from 'next/navigation'

import { BreadcrumbContext } from '@/providers/breadcrumbs/breadcrumb-context'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

describe('Crumbs', () => {
  const mockSetCrumbs = jest.fn()
  const mockSetHidden = jest.fn()

  const renderWithContext = (ui: React.ReactElement) => {
    return render(
      <BreadcrumbContext.Provider
        value={{
          crumbs: [],
          setCrumbs: mockSetCrumbs,
          hidden: false,
          setHidden: mockSetHidden,
        }}
      >
        {ui}
      </BreadcrumbContext.Provider>,
    )
  }

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue('')
  })

  it('sets crumbs based on pathname segments', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard/settings')

    renderWithContext(<Crumbs />)

    expect(mockSetCrumbs).toHaveBeenCalledWith([
      {
        segment: 'dashboard',
        path: '/dashboard',
        name: 'dashboard',
        hidden: false,
      },
      {
        segment: 'settings',
        path: '/dashboard/settings',
        name: 'settings',
        hidden: false,
      },
    ])
  })

  it('applies custom crumb metadata', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/org/123/members')

    const customCrumbs = [
      { segment: 'org', name: 'Organization' },
      { segment: '123', name: 'Acme Corp', hidden: true },
      { segment: 'members', name: 'Team Members' },
    ]

    renderWithContext(<Crumbs crumbs={customCrumbs} />)

    expect(mockSetCrumbs).toHaveBeenCalledWith([
      {
        segment: 'org',
        path: '/org',
        name: 'Organization',
        hidden: false,
      },
      {
        segment: '123',
        path: '/org/123',
        name: 'Acme Corp',
        hidden: true,
      },
      {
        segment: 'members',
        path: '/org/123/members',
        name: 'Team Members',
        hidden: false,
      },
    ])
  })

  it('sets hidden state from props', () => {
    renderWithContext(<Crumbs hidden={true} />)
    expect(mockSetHidden).toHaveBeenCalledWith(true)
  })

  it('uses default hidden value when not provided', () => {
    renderWithContext(<Crumbs />)
    expect(mockSetHidden).toHaveBeenCalledWith(false)
  })

  it('resets context on unmount', () => {
    const { unmount } = renderWithContext(<Crumbs />)

    unmount()

    expect(mockSetCrumbs).toHaveBeenLastCalledWith([])
    expect(mockSetHidden).toHaveBeenLastCalledWith(false)
  })

  it('handles empty pathname', () => {
    ;(usePathname as jest.Mock).mockReturnValue('')

    renderWithContext(<Crumbs />)

    expect(mockSetCrumbs).toHaveBeenCalledWith([])
  })

  it('handles root pathname', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')

    renderWithContext(<Crumbs />)

    expect(mockSetCrumbs).toHaveBeenCalledWith([])
  })

  it('updates context with new props', () => {
    const { rerender } = renderWithContext(<Crumbs hidden={false} />)
    expect(mockSetHidden).toHaveBeenLastCalledWith(false)

    rerender(
      <BreadcrumbContext.Provider
        value={{
          crumbs: [],
          setCrumbs: mockSetCrumbs,
          hidden: false,
          setHidden: mockSetHidden,
        }}
      >
        <Crumbs hidden={true} />
      </BreadcrumbContext.Provider>,
    )

    expect(mockSetHidden).toHaveBeenLastCalledWith(true)
  })
})
