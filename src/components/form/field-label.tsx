import { FC, InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'
import { IconType } from 'react-icons'
import {
  FiBriefcase,
  FiGlobe,
  FiInfo,
  FiMail,
  FiPhone,
  FiUser,
} from 'react-icons/fi'
import { LuCalendarDays } from 'react-icons/lu'

import { cn } from '@/utils/style'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type InputIcon =
  | 'mail'
  | 'phone'
  | 'web'
  | 'person'
  | 'briefcase'
  | 'calendar'

export const inputIconMap: { [x in InputIcon]: IconType } = {
  mail: FiMail,
  phone: FiPhone,
  web: FiGlobe,
  person: FiUser,
  briefcase: FiBriefcase,
  calendar: LuCalendarDays,
}

export type FieldLabelProps = {
  children: ReactNode
  className?: string
  error?: boolean
  icon?: InputIcon
  as?: keyof HTMLElementTagNameMap
  tooltip?: ReactNode
} & LabelHTMLAttributes<HTMLLabelElement> &
  Pick<InputHTMLAttributes<HTMLInputElement>, 'required' | 'disabled'>

const FieldLabel: FC<FieldLabelProps> = ({
  children,
  htmlFor,
  className,
  error,
  required,
  icon,
  as,
  tooltip,
  ...props
}) => {
  const Comp = as || ('label' satisfies keyof HTMLElementTagNameMap)

  const Icon = icon ? inputIconMap?.[icon] : null

  return (
    <div className={cn('flex items-center flex-auto gap-2', className)}>
      <Comp
        htmlFor={htmlFor}
        className={cn([
          'text-sm text-gray-700 dark:text-gray-100 w-fit',
          required &&
            "after:content-['*'] after:ml-[0.125rem] after:text-red-400",
          error && 'text-red-500',
        ])}
      >
        {children}
        {Icon ? (
          <Icon
            aria-hidden
            className={cn([
              'absolute mt-[0.925rem] ml-[0.625rem] text-lg text-gray-500 dark:text-gray-300',
              !children && 'mt-[1.95rem]',
              props?.disabled && 'cursor-not-allowed',
            ])}
          />
        ) : null}
      </Comp>
      {tooltip ? (
        <Popover>
          <PopoverTrigger>
            <FiInfo className='text-white text-xl shrink-0 fill-blue-500' />
          </PopoverTrigger>
          <PopoverContent className='w-full max-w-[90vw] md:max-w-prose'>
            {tooltip}
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}

export default FieldLabel
