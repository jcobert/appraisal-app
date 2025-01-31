import { useStyledIntersection } from './use-styled-intersection'
import { useEffect, useState } from 'react'
import { useWindowSize } from 'usehooks-ts'

type PageSize = {
  header: {
    /** Full height of `<header>` (in px). */
    height: number
    /** Height of `<header>` that is visible on screen (in px). */
    visibleHeight: number
    /** Whether any part of the `<header>` is visible on screen. */
    isVisible: boolean
  }
  footer: {
    /** Full height of `<footer>` (in px). */
    height: number
    /** Height of `<footer>` that is visible on screen (in px). */
    visibleHeight: number
    /** Whether any part of the `<footer>` is visible on screen. */
    isVisible: boolean
  }
  main: {
    /** Height of `<main>` (in px). */
    height: number
    /** Width of `<main>` (in px). */
    width: number
    /**
     * Dimensions of the children of `<main>`, less any padding.
     * Effectively, the dimensions of displayed page content.
     */
    content: {
      /** Height of visible page content (in px). */
      height: number
      /** Width of visible page content (in px). */
      width: number
    }
  }
  /** A dynamic viewport height (in px) that excludes any visible portion of the header or footer. */
  usableHeight: number
  /** A dynamic viewport width (in px) that excludes any visible portion of the sidebar. */
  usableWidth: number
  windowWidth: number
  windowHeight: number
}

/**
 * Returns the dimensions of an element, excluding any padding.
 * @example getInnerDimensions(el) // where el is a <div> that is 100px x 200px with 8px padding all around
 * => { width: 84, height: 184 }
 */
export const getInnerDimensions = (element?: Element | HTMLElement | null) => {
  if (!element) return { width: 0, height: 0 }

  const style = getComputedStyle(element)

  let width = element.clientWidth
  let height = element.clientHeight

  const paddingX =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  const paddingY =
    parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)

  width -= paddingX
  height -= paddingY

  return { width, height }
}

/**
 * Returns the dimensions of an element, including any margins.
 * @example getOuterDimensions(el) // where el is a <div> that is 100px x 200px with 8px top and bottom margins
 * => { width: 100, height: 216 }
 */
export const getOuterDimensions = (element?: Element | HTMLElement | null) => {
  if (!element) return { width: 0, height: 0 }

  const style = getComputedStyle(element)

  let width = element.clientWidth
  let height = element.clientHeight

  const marginX = parseFloat(style.marginLeft) + parseFloat(style.marginRight)
  const marginY = parseFloat(style.marginTop) + parseFloat(style.marginBottom)

  width += marginX
  height += marginY

  return { width, height }
}

/**
 * Returns dimensions of `<main>` and `<header>` elements. Also returns whether header is visible and how much is visible.
 */
export const usePageSize = (deps: unknown[] = []) => {
  const { width: windowWidth, height: windowHeight } = useWindowSize()

  const {
    intersectionRatio: headerIntersectionRatio,
    isIntersecting: headerVisible,
  } = useStyledIntersection({
    interceptRef: {
      current: document.getElementsByTagName('header')?.[0] || null,
    },
  })

  const {
    intersectionRatio: footerIntersectionRatio,
    isIntersecting: footerVisible,
  } = useStyledIntersection({
    interceptRef: {
      current: document.getElementsByTagName('footer')?.[0] || null,
    },
  })

  const [size, setSize] = useState<Partial<PageSize>>({
    header: { height: 0, isVisible: true, visibleHeight: 0 },
    footer: { height: 0, isVisible: true, visibleHeight: 0 },
    main: { height: 0, width: 0, content: { height: 0, width: 0 } },
    usableHeight: 0,
    usableWidth: 0,
  })

  useEffect(() => {
    const header = document.getElementsByTagName('header')?.[0]
    const headerHeight = header?.clientHeight || 0
    const visibleHeaderHeight = headerIntersectionRatio * headerHeight

    const footer = document.getElementsByTagName('footer')?.[0]
    const footerHeight = footer?.clientHeight || 0
    const visibleFooterHeight = footerIntersectionRatio * footerHeight

    const sidebar = document.getElementById('navigation-sidebar')

    const main = document.getElementsByTagName('main')?.[0]
    const mainWidth = main?.clientWidth || 0
    const mainHeight = main?.clientHeight || 0

    const pageContent = getInnerDimensions(main?.children?.[0])

    const usableWidth =
      document.documentElement.clientWidth - (sidebar?.clientWidth || 0)
    const usableHeight =
      document.documentElement.clientHeight -
      visibleHeaderHeight -
      visibleFooterHeight

    setSize({
      header: {
        height: headerHeight,
        visibleHeight: visibleHeaderHeight,
        isVisible: headerVisible,
      },
      footer: {
        height: footerHeight,
        visibleHeight: visibleFooterHeight,
        isVisible: footerVisible,
      },
      main: { height: mainHeight, width: mainWidth, content: pageContent },
      usableHeight,
      usableWidth,
    })
  }, [
    windowWidth,
    windowHeight,
    headerIntersectionRatio,
    footerIntersectionRatio,
    ...deps,
  ])

  return { ...size, windowHeight, windowWidth } as PageSize
}
