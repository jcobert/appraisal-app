'use client'

import {
  FC,
  FormEventHandler,
  FormHTMLAttributes,
  SyntheticEvent,
  useRef,
  useState,
} from 'react'

import { cn } from '@/utils/style'

import FullScreenLoader from '@/components/layout/full-screen-loader'

import { useDisableInteraction } from '@/hooks/use-disable-interaction'

export type FormProps = {
  /**
   * Whether to disable interactive elements while form submission is in progress. Accepts the following:
   * - `"all"` - Disables all elements in document.
   * - `"form"` - Disables only elements within this form.
   *
   * Provide `false` to bypass this functionality and keep elements enabled.
   * @default "all"
   */
  disableOnLoading?: 'all' | 'form' | boolean
  /**
   * How to display loading indicator while form submission is in progress (or when `loading` is `true`).
   * @default "fullscreen"
   */
  loader?: 'fullscreen' | 'none'
  /**
   * The form is always considered to be in loading state when its `onSubmit` is in progress.
   * Provide this value to specify additionally when form is in loading state.
   *
   * When `true` will display loading indicator and/or disabling of interactions
   * (see `loader` and `disableOnLoading` props).
   *
   * Note: It is unlikely you will need this, as most "loading" actions take place on submit,
   * but is available for finer control if needed.
   * @default false
   */
  loading?: boolean
  onSubmit?: (e: SyntheticEvent) => Promise<void> | void
  unstyled?: boolean
} & Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>

const Form: FC<FormProps> = ({
  children,
  loading = false,
  disableOnLoading = 'all',
  loader = 'fullscreen',
  className,
  onSubmit,
  unstyled = false,
  ...formProps
}) => {
  const formRef = useRef<HTMLFormElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmitHandler: FormEventHandler<HTMLFormElement> = async (e) => {
    setIsSubmitting(true)
    try {
      await onSubmit?.(e)
    } catch (error) {
      setIsSubmitting(false)
      // eslint-disable-next-line no-console
      console.error(error)
    }
    setIsSubmitting(false)
  }

  useDisableInteraction({
    disable: !disableOnLoading ? false : isSubmitting || loading,
    container: disableOnLoading === 'form' ? formRef.current : null,
  })

  return (
    <>
      {(isSubmitting || loading) && loader === 'fullscreen' ? (
        <FullScreenLoader />
      ) : null}

      <form
        ref={formRef}
        onSubmit={onSubmitHandler}
        {...formProps}
        className={cn({ 'flex flex-col gap-8': !unstyled }, className)}
      >
        {!unstyled ? (
          <div className='flex flex-col gap-16 max-w-3xl self-center size-full border dark:border-gray-500 rounded bg-almost-white dark:bg-zinc-800 p-6'>
            {children}
          </div>
        ) : null}
        {unstyled ? children : null}
      </form>
    </>
  )
}

export default Form
