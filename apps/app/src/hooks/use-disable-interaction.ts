import { useEffect, useState } from 'react'

export type UseDisableInteractionProps = {
  /** Enables/disables interactivity. When `true` all interactive elements will be inert. */
  disable?: boolean
  /**
   * Element containing the interactive elements that should be disabled.
   * By default, all interactive elements in the DOM will be disabled.
   * Provide to restrict the affected area.
   */
  container?: HTMLElement | null
}

/**
 * Prevents interaction with all interactive elements within DOM or `container` (if provided).
 * Toggles interactivty based on provided `disable` value.
 *
 * Note: HTML `inert` attribute is used to disable interaction, not the `disabled` attribute.
 * As such, if you want disabled styling, be sure to target the inert state.
 * @example
 *
 * useDisableInteraction({ disable: isSubmitting })
 * <form>
 *  ...
 *  <button onClick={async () => {
 *    setIsSubmitting(true)
 *    await fetchData()
 *    setIsSubmitting(false)
 *  }}>
 *   Submit
 *  </button>
 * </form>
 * // When form submission is in progress, all interactive elements will be disabled, then re-enabled when request is complete.
 */
export const useDisableInteraction = ({
  disable = false,
  container,
}: UseDisableInteractionProps) => {
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null)

  // All interactive elements
  // const elements = containingElement.querySelectorAll<HTMLInputElement>('button, input, textarea, select, a')

  useEffect(() => {
    const containingElement =
      container || (typeof window !== 'undefined' ? document.body : null)
    if (!containingElement || typeof disable === 'undefined') return

    setActiveElement(document.activeElement as HTMLElement)

    if (disable) {
      containingElement.setAttribute('inert', 'true')
    } else {
      containingElement.removeAttribute('inert')
    }

    // Return focus to the element that was active prior to disabling.
    if (activeElement) {
      activeElement?.focus?.()
    }

    return () => {
      containingElement.removeAttribute('inert')
    }
  }, [disable])
}
