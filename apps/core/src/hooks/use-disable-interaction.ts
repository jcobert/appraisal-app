import { useEffect, useRef } from 'react'

import { APP_MAIN_UI_LAYOUT_ID } from '@/configuration/ui'

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
  // We store the previously-active element so we can restore focus after interaction re-enabled.
  const previousActiveRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const containingElement =
      container ||
      (typeof window !== 'undefined'
        ? document.body.querySelector(`#${APP_MAIN_UI_LAYOUT_ID}`) ||
          document.body
        : null)
    if (!containingElement || typeof disable === 'undefined') return

    if (disable) {
      // Save the active element before disabling so we can restore focus later.
      previousActiveRef.current = document.activeElement as HTMLElement | null
      containingElement.setAttribute('inert', 'true')
    } else {
      containingElement.removeAttribute('inert')

      // Return focus to the element that was active prior to disabling.
      previousActiveRef.current?.focus?.()
      previousActiveRef.current = null
    }

    return () => {
      containingElement.removeAttribute('inert')
    }
  }, [disable, container])
}
