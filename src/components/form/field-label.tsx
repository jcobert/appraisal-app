import { FC, InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'
import { IconType } from 'react-icons'
import { FiBriefcase, FiGlobe, FiMail, FiPhone, FiUser } from 'react-icons/fi'

import { cn } from '@/utils/style'

export type InputIcon = 'mail' | 'phone' | 'web' | 'person' | 'briefcase'

export const inputIconMap: { [x in InputIcon]: IconType } = {
  mail: FiMail,
  phone: FiPhone,
  web: FiGlobe,
  person: FiUser,
  briefcase: FiBriefcase,
}

export type FieldLabelProps = {
  children: ReactNode
  className?: string
  error?: boolean
  icon?: InputIcon
  as?: keyof HTMLElementTagNameMap
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
  ...props
}) => {
  const Comp = as || ('label' satisfies keyof HTMLElementTagNameMap)

  const Icon = icon ? inputIconMap?.[icon] : null

  return (
    <Comp
      htmlFor={htmlFor}
      className={cn([
        'text-sm text-gray-700 dark:text-gray-100 w-fit',
        required &&
          "after:content-['*'] after:ml-[0.125rem] after:text-red-400",
        error && 'text-red-500',
        className,
      ])}
    >
      {children}
      {Icon ? (
        <Icon
          className={cn([
            'absolute mt-[0.925rem] ml-[0.625rem] text-lg text-gray-500 dark:text-gray-300',
            !children && 'mt-[1.95rem]',
            props?.disabled && 'cursor-not-allowed',
          ])}
        />
      ) : null}
    </Comp>
  )
}

export default FieldLabel
