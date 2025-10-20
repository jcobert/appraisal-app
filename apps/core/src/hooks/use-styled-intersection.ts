import { MutableRefObject, useEffect, useLayoutEffect, useState } from 'react'
import { useWindowSize } from 'usehooks-ts'

export type UseStyledIntersectionProps = {
  /** Target element to act on when intersecting. Provide a `ref` to the element. */
  targetRef?: MutableRefObject<HTMLElement | null>
  /** Element to observe intersection with. Provide a `ref` to the element. */
  interceptRef?: MutableRefObject<HTMLElement | null>
  /** Class names to apply to the target element when intersecting. */
  className?: string
  /** Styles to apply to the target element when intersecting. */
  styles?: Partial<HTMLElement['style']>
} & IntersectionObserverInit

/**
 * Sets up an `IntersectionObserver` for the the provided target and intercept elements.
 *
 * If provided, adds/removes the `className` and `styles` to/from the target element, based on intersection status.
 * Several useful properties are returned that can be used to apply dynamic styling in your component as well.
 *
 * Returns an object with the following properties:
 * - `isIntersecting`: Whether the target element is currently intersecting the intercept element.
 * - `windowSize`: Current window dimensions (in pixels).
 * - `scrollbarWidths`: An object containing the widths of the window's horizontal and vertical scrollbars (in pixels).
 *
 * Sets the following CSS variables in the target element that can be used in CSS calculations:
 * - `--scrollbar-x-width`: Width of the window's horizonal scrollbar (in pixels).
 * - `--scrollbar-y-width`: Width of the window's vertical scrollbar (in pixels).
 */
export const useStyledIntersection = ({
  targetRef,
  interceptRef,
  className = '',
  styles,
  ...observerOptions
}: UseStyledIntersectionProps) => {
  const windowSize = useWindowSize()

  const [isIntersecting, setIsIntersecting] = useState(true)
  const [intersectionRatio, setIntersectionRatio] = useState(0)
  const [scrollbarWidths, setScrollbarWidths] = useState({ x: 0, y: 0 })

  // Calculates and sets CSS variables for scrollbar dimensions.
  useLayoutEffect(() => {
    const { clientWidth, clientHeight } = document.documentElement
    const { innerWidth, innerHeight } = window

    const widthX = innerHeight - clientHeight
    const widthY = innerWidth - clientWidth

    setScrollbarWidths({ x: widthX, y: widthY })

    targetRef?.current?.style?.setProperty('--scrollbar-x-width', `${widthX}px`)
    targetRef?.current?.style?.setProperty('--scrollbar-y-width', `${widthY}px`)

    return () => {
      targetRef?.current?.style?.removeProperty('--scrollbar-x-width')
      targetRef?.current?.style?.removeProperty('--scrollbar-y-width')
    }
  }, [windowSize])

  const buildThresholdList = () => {
    const thresholds: number[] = []
    const numSteps = 20

    // eslint-disable-next-line no-plusplus
    for (let i = 1.0; i <= numSteps; i++) {
      const ratio = i / numSteps
      thresholds.push(ratio)
    }

    thresholds.push(0)
    return thresholds
  }

  // Sets up intersection observer
  useEffect(() => {
    const target = targetRef?.current
    const intercept = interceptRef?.current
    if (!intercept) return

    const toggleStyles = (mode: 'add' | 'remove') => {
      if (!styles) return
      if (mode === 'add') {
        Object.keys(styles)?.forEach((prop) => {
          target?.style?.setProperty(prop, styles[prop])
        })
      } else {
        Object.keys(styles)?.forEach((prop) => {
          target?.style?.removeProperty(prop)
        })
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsIntersecting(!entry?.isIntersecting)
          setIntersectionRatio(entry?.intersectionRatio)

          if (className) {
            target?.classList.toggle(className, !entry.isIntersecting)
          }

          if (!entry.isIntersecting) {
            toggleStyles('add')
          } else {
            toggleStyles('remove')
          }
        })
      },
      { ...observerOptions, threshold: buildThresholdList() },
    )
    observer.observe(intercept)

    // eslint-disable-next-line consistent-return
    return () => {
      observer.disconnect()
      toggleStyles('remove')
    }
  }, [interceptRef])

  return { isIntersecting, intersectionRatio, windowSize, scrollbarWidths }
}
