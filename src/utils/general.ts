import { FetchResponse } from '@/utils/fetch'

import { GenericValue } from '@/types/general'

/**
 * Returns whether the value is **not** one of the following: `undefined`, `null`, `''`.
 *
 * Options:
 * - `allowEmptyString` - If `true` empty string will be considered an existant value and `true` will be returned.
 * Default is `false`.
 */
export const exists = (
  val: unknown,
  options: { allowEmptyString?: boolean } = { allowEmptyString: false },
): val is Exclude<GenericValue, null | undefined> => {
  return ![
    undefined,
    null,
    ...(!options?.allowEmptyString ? [''] : []),
  ].includes(val as string)
}

/** Returns whether the value is a common object. Arrays and `Date` instances return `false`. */
export const isObject = (val: unknown): val is object => {
  if (!val) return false
  return (
    typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)
  )
}

/** Returns an array of object values. */
export const objectValues = <T extends Record<string, unknown>>(obj: T) => {
  return Object.values(obj) as T[keyof T][]
}

/** Returns an array of object keys. */
export const objectKeys = <T extends Record<string, unknown>>(obj: T) => {
  return Object.keys(obj) as (keyof T)[]
}

/** Returns an array of object entries. */
export const objectEntries = <T extends Record<string, unknown>>(obj: T) => {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}

type WithoutBlanksReturn<
  TObj extends Record<string, unknown>,
  TEmpty extends boolean = true,
> = TEmpty extends true ? Partial<TObj> : Partial<TObj> | undefined
/** Returns the given object with properties that have no value removed. */
export const withoutBlanks = <
  TObj extends Record<string, unknown>,
  TEmpty extends boolean = true,
>(
  obj: TObj,
  options?: Parameters<typeof exists>['1'] & {
    /** When `obj` is not an object or all of its values are blank:
     * If `true`, will return an empty object. If `false` will return undefined. Default is `true`.  */
    returnEmpty?: TEmpty
  },
): WithoutBlanksReturn<TObj, TEmpty> => {
  const { returnEmpty = true, ...opts } = options ?? {}
  let newObj: Partial<TObj> = {}
  if (!isObject(obj))
    return returnEmpty ? {} : (undefined as WithoutBlanksReturn<TObj, TEmpty>)
  newObj = Object.fromEntries(
    Object.entries(obj)?.filter(([_, val]) => exists(val, { ...opts })),
  ) as Partial<TObj>
  const isEmpty = !Object.keys(newObj)?.length
  if (isEmpty) {
    return returnEmpty ? {} : (undefined as WithoutBlanksReturn<TObj, TEmpty>)
  }
  return newObj
}

/**
 * Replaces `null` or `undefined` object values with empty string (`""`) or the specified `replaceWith` value.
 * Returns a new object with any replacments.
 */
export const replaceEmptyValues = <
  TObj extends Record<string, unknown> | null | undefined,
  TReplacement = '',
  TAllowNull extends boolean = false,
>(
  obj: TObj,
  options?: {
    /** Value to replace `null` or `undefined` values with. Default is empty string (`""`). */
    replaceWith?: TReplacement
    /** Whether to keep `null` values. Only `undefined` values will be replaced. Default is `false`. */
    allowNull?: TAllowNull
  },
) => {
  const { replaceWith = '', allowNull = false } = options || {}
  if (!obj) return obj
  const newObj = {}
  Object.entries(obj)?.forEach(([key, value]) => {
    const newValue = isObject(value)
      ? replaceEmptyValues(value as TObj, options)
      : value
    if (allowNull && newValue === null) {
      newObj[key] = newValue
    } else {
      newObj[key] = newValue ?? replaceWith
    }
  })
  return newObj as
    | TObj
    | {
        [key in keyof TObj]: TAllowNull extends false
          ? TReplacement
          : TReplacement | null
      }
}

/**
 * Resolves an arbitrary promise after the specified `time` (in ms). Default `time` is 1 second.
 * Useful during development (e.g. simulating API request) or to add a fixed delay within async operations.
 * @example
 * const onSubmit = async () => {
 *   foo()
 *   await asyncDelay(3000)
 *   await fetchData()
 * }
 */
export const asyncDelay = <T = FetchResponse>(time = 1000, res?: T) => {
  const response = res ?? {}
  const promise = new Promise<T>((resolve) => {
    setTimeout(() => {
      resolve(response as T)
    }, time)
  })
  return promise
}

export const isOk = (code?: string) => {
  if (!code) return false
  return code?.toLowerCase() === 'ok'
}
