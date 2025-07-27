'use client'

import { ReactNode, forwardRef, useEffect, useState } from 'react'
import Select, {
  ActionMeta,
  GroupBase,
  Props,
  SelectInstance,
  StylesConfig,
} from 'react-select'

import { cn } from '@/utils/style'

import FieldError from '@/components/form/field-error'
import FieldHelper from '@/components/form/field-helper'
import { AdditionalInputProps } from '@/components/form/inputs/text-input'

export const selectStyles: StylesConfig<any, boolean, GroupBase<any>> = {
  control: (base) => ({
    ...base,
    borderWidth: '1px',
    borderColor: 'rgb(209, 213, 219)',
    '&:hover': {
      borderColor: 'rgb(148, 163, 184)',
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: 'rgb(156, 163, 175)',
  }),
}

export type SelectInputProps = Omit<Props, 'onChange' | 'aria-label'> &
  Omit<AdditionalInputProps, 'icon' | 'inputClassName'> & {
    className?: string
    ariaLabel?: string
    onChange?: (
      opt: SelectOption<any, any>,
      actionMeta: ActionMeta<unknown>,
    ) => void
  }

const SelectInput = forwardRef<SelectInstance, SelectInputProps>(
  (
    {
      label,
      helper,
      helperMode = 'always',
      className,
      labelClassName,
      id,
      name,
      error,
      onChange,
      classNames,
      ariaLabel,
      menuPortalTarget,
      ...props
    },
    ref,
  ) => {
    const [isMounted, setIsMounted] = useState(false)

    const [helperVisible, setHelperVisible] = useState(
      helperMode === 'always' ? true : false,
    )

    useEffect(() => {
      setIsMounted(true)
    }, [])

    if (!isMounted)
      return (
        <div className='flex flex-col gap-1'>
          <span
            className={cn([
              'text-sm text-gray-700 dark:text-gray-100 w-fit',
              props?.required &&
                "after:content-['*'] after:ml-[0.125rem] after:text-red-400",
              error && 'text-red-500',
              labelClassName,
            ])}
          >
            {label}
          </span>
          <div className='h-10 sm:w-60 max-w-full bg-gray-100 border rounded animate-pulse' />
        </div>
      )

    return (
      <div className={cn(['flex flex-col gap-1', className])}>
        <label
          htmlFor={id || name}
          aria-label={!label ? ariaLabel || id : ariaLabel}
          className={cn([
            'text-sm text-gray-700 dark:text-gray-100 w-fit',
            props?.required &&
              "after:content-['*'] after:ml-[0.125rem] after:text-red-400",
            error && 'text-red-500',
            labelClassName,
          ])}
        >
          {label}
        </label>

        <Select
          inputId={id || name}
          name={name}
          menuShouldBlockScroll
          menuShouldScrollIntoView
          classNames={{
            container: () => 'dark:!bg-zinc-800',
            control: (props) =>
              cn([
                '!transition !px-1 !py-px !border !border-gray-300 dark:!border-gray-500 [&:not(:disabled)]:hover:!border-gray-400 disabled:!text-gray-500 !rounded dark:!bg-zinc-600 !shadow-none',
                error && 'border-red-500 hover:border-red-500',
                props.isFocused && '!ring-2 !ring-brand-light ring-offset-2',
                props.isDisabled && 'cursor-not-allowed',
              ]),
            placeholder: () => 'text-base text-zinc-400 dark:!text-zinc-300',
            menu: () => 'dark:!bg-zinc-800 !z-[999]',
            menuList: () => 'dark:!bg-zinc-800 !z-[999]',
            menuPortal: () => 'dark:!bg-zinc-800 !z-[999]',
            option: (props) =>
              cn({
                'dark:!bg-zinc-700 !bg-brand-extra-light':
                  props.isFocused && !props.isSelected,
                '!bg-primary': props.isSelected,
              }),
            input: () => cn('dark:!text-zinc-100'),
            singleValue: () => cn('dark:!text-zinc-100'),
            ...classNames,
          }}
          styles={{
            ...selectStyles,
            multiValue: (base) => ({
              ...base,
              backgroundColor: 'rgb(240, 240, 240)',
              borderWidth: '1px',
              borderRadius: '50px',
              padding: '0 4px',
              maxHeight: '28px',
            }),
            multiValueRemove: (base) => ({
              ...base,
              color: 'rgb(150, 150, 150)',
              transition: 'all 0.1s ease-in-out',
              '&:hover': {
                backgroundColor: 'unset',
                color: 'rgb(100, 100, 100)',
              },
            }),
            clearIndicator: (base) => ({
              ...base,
              color: '#828797',
              '&:hover': { color: '#454957' },
            }),
          }}
          onChange={onChange as Props['onChange']}
          menuPortalTarget={
            isMounted ? menuPortalTarget || document.body : undefined
          }
          {...props}
          ref={ref}
          onFocus={() => {
            if (helperMode === 'focus') {
              setHelperVisible(true)
            }
          }}
          onBlur={() => {
            if (helperMode === 'focus') {
              setHelperVisible(false)
            }
          }}
        />

        {helperVisible ? <FieldHelper text={helper} /> : null}
        <FieldError error={error} />
      </div>
    )
  },
)

export default SelectInput

export type SelectOption<
  T extends ReactNode = string,
  U extends ReactNode = ReactNode,
> = {
  value: T
  label: U
}
